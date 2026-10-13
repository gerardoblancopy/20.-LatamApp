"""Función de Vercel que ejecuta el modelo de optimización para un escenario.

Recibe (POST /api/run-model) la misma configuración que la página envía al servidor
Express y responde con el mismo protocolo de Server-Sent Events que server.js: eventos
"log" con la salida de data_processing.py y "error" o "done" al terminar. En Vercel no se
puede escribir en los archivos del proyecto, así que el modelo corre en una carpeta
temporal y, antes de "done", un evento "results" envía los JSON del escenario para que el
navegador los muestre (ver public/api_client.js).
"""
import json
import os
import queue
import shutil
import subprocess
import sys
import tempfile
import threading
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_SCRIPT = os.path.join(ROOT, "data_processing.py")
INPUT_DIR = os.path.join(ROOT, "data", "input")
INPUT_WORKBOOK = os.path.join(INPUT_DIR, "MODELO PLANTILLA DE DATOS V9_INTx.xlsx")

SCENARIOS = {"S0", "S1"}
# data_processing.py termina bien aunque fallen sus scripts de extracción del final,
# que son los que generan los resúmenes por generador y por demanda
REQUIRED_RESULTS = ("lines_processed.json", "generators_summary.json", "demand_summary.json")
# Margen bajo el maxDuration de 300 s de vercel.json, para avisar antes de que Vercel corte
TIME_LIMIT_SECONDS = 285
KEEPALIVE_SECONDS = 15
# Cada corrida usa unos 0,8 GB de RAM y una instancia tiene 2 GB
_run_slots = threading.BoundedSemaphore(2)


def sse(event_type, data):
    return f"data: {json.dumps({'type': event_type, 'data': data})}\n\n".encode("utf-8")


def read_config(environ):
    try:
        length = int(environ.get("CONTENT_LENGTH") or 0)
    except ValueError:
        length = 0
    config = json.loads(environ["wsgi.input"].read(length) or b"{}")
    if config.get("escenario_ejecucion") not in SCENARIOS:
        raise ValueError("escenario_ejecucion debe ser S0 o S1")
    return config


def input_problem():
    # Sin Git LFS activado en el proyecto, Vercel clona solo el puntero de la planilla
    if not os.path.exists(INPUT_WORKBOOK):
        return "No se encontró la planilla de entrada en data/input/."
    with open(INPUT_WORKBOOK, "rb") as workbook:
        if workbook.read(40).startswith(b"version https://git-lfs"):
            return "La planilla de entrada es un puntero de Git LFS: activa Git LFS en el proyecto de Vercel."
    return None


def stream_model_run(config):
    if not _run_slots.acquire(blocking=False):
        yield sse("error", "Hay otras simulaciones en curso; intenta de nuevo en unos minutos.")
        return
    workdir = tempfile.mkdtemp(prefix="latam-model-")
    child = None
    try:
        os.makedirs(os.path.join(workdir, "data"))
        os.symlink(INPUT_DIR, os.path.join(workdir, "data", "input"))
        env = {
            **os.environ,
            "PYTHONUNBUFFERED": "1",
            "MPLBACKEND": "Agg",
            "MPLCONFIGDIR": workdir,
            # El intérprete hijo debe ver las mismas dependencias que esta función
            "PYTHONPATH": os.pathsep.join(path for path in sys.path if path),
        }
        child = subprocess.Popen(
            [sys.executable, MODEL_SCRIPT, json.dumps(config)],
            cwd=workdir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
        )

        lines = queue.Queue()

        def pump_output():
            for line in child.stdout:
                lines.put(line.rstrip("\n"))
            lines.put(None)

        threading.Thread(target=pump_output, daemon=True).start()

        deadline = time.monotonic() + TIME_LIMIT_SECONDS
        while True:
            if time.monotonic() > deadline:
                yield sse("error", f"El modelo superó el tiempo máximo de Vercel ({TIME_LIMIT_SECONDS} s).")
                return
            try:
                line = lines.get(timeout=KEEPALIVE_SECONDS)
            except queue.Empty:
                yield b": keepalive\n\n"
                continue
            if line is None:
                break
            if line.strip():
                yield sse("log", line)

        code = child.wait()
        if code != 0:
            yield sse("error", f"Process exited with code {code}")
            return

        scenario_dir = os.path.join(workdir, "data", "scenarios", config["escenario_ejecucion"])
        files = {}
        for name in sorted(os.listdir(scenario_dir)):
            if name.endswith(".json"):
                with open(os.path.join(scenario_dir, name), encoding="utf-8") as result_file:
                    files[name] = json.load(result_file)
        missing = [name for name in REQUIRED_RESULTS if name not in files]
        if missing:
            yield sse("error", f"El modelo terminó pero faltan resultados ({', '.join(missing)}); revisa el log.")
            return
        yield sse("results", files)
        yield sse("done", "Model executed successfully")
    finally:
        # También se llega aquí si el navegador cierra la conexión a mitad de la corrida
        if child is not None and child.poll() is None:
            child.kill()
            child.wait()
        shutil.rmtree(workdir, ignore_errors=True)
        _run_slots.release()


def app(environ, start_response):
    if environ["REQUEST_METHOD"] != "POST":
        start_response("405 Method Not Allowed", [("Allow", "POST"), ("Content-Type", "text/plain; charset=utf-8")])
        return [b"Usa POST con la configuracion del modelo."]
    try:
        config = read_config(environ)
    except ValueError as exc:  # incluye JSON inválido
        start_response("400 Bad Request", [("Content-Type", "text/plain; charset=utf-8")])
        return [str(exc).encode("utf-8")]

    start_response("200 OK", [
        ("Content-Type", "text/event-stream"),
        ("Cache-Control", "no-cache"),
        ("X-Accel-Buffering", "no"),
    ])
    problem = input_problem()
    if problem:
        return [sse("error", problem)]
    return stream_model_run(config)
