---
title: LATAM Interconexión - Simulador de Remuneración
emoji: ⚡
colorFrom: indigo
colorTo: green
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# LATAM Interconexión App

Aplicación web para simulación y visualización de interconexiones eléctricas LATAM.

## Estructura del repositorio

- `public/`: frontend estático (mapa, estilos y lógica cliente).
- `server.js`: API backend (Express) y servidor estático.
- `data_processing.py`: ejecución del modelo de optimización.
- `data/input/`: insumo principal (`MODELO PLANTILLA DE DATOS V9_INTx.xlsx`).
- `data/scenarios/`: escenarios operativos consumidos por la app (`S0`, `S1`).
- `data/analysis/`: artefactos de análisis y salidas auxiliares.
- `data/scenario_experiments/`: escenarios/experimentos históricos (no core runtime).
- `scripts/analysis/`: scripts de análisis reproducible.
- `scripts/maintenance/`: utilidades de limpieza/parcheo/verificación.
- `docs/`: documentación técnica.
- `legacy/`: código legado no crítico para operación diaria.

## Ejecutar local

1. Instalar dependencias Node:
   `npm install`
2. Instalar dependencias Python:
   `pip install -r requirements.txt`
3. Iniciar servidor:
   `node server.js`
4. Abrir en navegador:
   `http://localhost:3005`

## Publicación en Vercel

La página es estática y el botón *Ejecutar Modelo* llama a la función `api/run_model.py`, que corre
`data_processing.py` (con HiGHS) en una carpeta temporal y transmite el log en vivo. Configuración
en `vercel.json`.

- **Publicar:** cada push a `master` publica en producción; cada rama tiene su vista previa.
- **Resultados de una ejecución:** se ven solo en la pestaña de quien la lanzó. Al recargar se vuelve
  a los resultados publicados (`data/scenarios/`), que se actualizan con el workflow *Ejecutar modelo*
  de GitHub Actions (abajo).
- **Límites del plan gratuito:** 300 s por escenario (hoy toma unos 2,5 minutos) y una cuota mensual de CPU.
- **Git LFS** debe estar activado en el proyecto de Vercel: la planilla de entrada está en LFS.

## Publicación en GitHub Pages + GitHub Actions

Versión estática en GitHub Pages; el modelo se ejecuta en GitHub Actions y sus resultados quedan
guardados en el repositorio (también los muestra Vercel en su siguiente despliegue).

- **Activar Pages (una sola vez):** en el repositorio, *Settings → Pages → Build and deployment → Source: GitHub Actions*.
- **Publicar:** cada push a `master` corre el workflow *Publicar en GitHub Pages*
  (`.github/workflows/pages.yml`), que genera el sitio con `node scripts/build_static_site.js`.
- **Ejecutar el modelo:** *Actions → Ejecutar modelo → Run workflow*, con los mismos parámetros del
  modal de configuración. Corre `data_processing.py` con HiGHS, guarda los resultados en
  `data/scenarios/` y vuelve a publicar la página. Requiere permiso de escritura en el repositorio.

Para probar el sitio estático en local: `node scripts/build_static_site.js` y servir `_site/`
(por ejemplo `python3 -m http.server -d _site`).

## Notas de operación

- El backend lee y escribe escenarios en `data/scenarios/<escenario>/`.
- El modelo Python usa el archivo de entrada en `data/input/`.
