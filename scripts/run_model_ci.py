"""Ejecuta data_processing.py con los parámetros del workflow "Ejecutar modelo".

Lee los inputs de workflow_dispatch desde la variable INPUTS_JSON (toJSON(inputs))
y corre cada escenario pedido con la misma configuración que envía la página
al servidor Express (ver el botón run-model-btn en public/script.js).
"""
import json
import os
import subprocess
import sys

ESCENARIOS = {"S0 y S1": ["S0", "S1"], "S0": ["S0"], "S1": ["S1"]}


def as_bool(value):
    # data_processing.py usa bool(...), y bool("false") sería True
    return value is True or str(value).lower() == "true"


def main():
    inputs = json.loads(os.environ["INPUTS_JSON"])

    linea_obj = str(inputs.get("linea_obj") or "").strip()
    if linea_obj and not linea_obj.isdigit():
        sys.exit(f"La línea candidata fija en S1 debe ser un ID numérico, no {linea_obj!r}")

    config = {
        "year_obj": inputs["year_obj"],
        "costo_combustible": inputs["costo_combustible"],
        "hidrologia": inputs["hidrologia"],
        "inversiones_intx": inputs["inversiones_intx"],
        "inversiones_gx": inputs["inversiones_gx"],
        "demanda_tipo": inputs["demanda_tipo"],
        # Gurobi necesita licencia; data_processing.py también cae a HiGHS si no la encuentra
        "solver": "appsi_highs",
        "sincarbonCL": as_bool(inputs["sincarbonCL"]),
        "bloquear_invtx_nacional": as_bool(inputs["bloquear_invtx_nacional"]),
        "bloquear_invtx_existenteinternacional": as_bool(inputs["bloquear_invtx_existenteinternacional"]),
        "flux0_internacional_candidata": as_bool(inputs["flux0_internacional_candidata"]),
        "ordendemerito": as_bool(inputs["ordendemerito"]),
        "linea_obj": int(linea_obj) if linea_obj else None,
    }

    for escenario in ESCENARIOS[inputs["escenarios"]]:
        print(f"::group::Escenario {escenario}", flush=True)
        result = subprocess.run(
            [sys.executable, "data_processing.py", json.dumps({**config, "escenario_ejecucion": escenario})]
        )
        print("::endgroup::", flush=True)
        if result.returncode != 0:
            sys.exit(f"El modelo falló en el escenario {escenario} (código {result.returncode})")


if __name__ == "__main__":
    main()
