// Acceso a la API compartido por script.js y chart_helper.js.
// En modo estático (GitHub Pages, Vercel) cada respuesta de /api/<endpoint>?scenario=<S>
// está pre-generada como api/<endpoint>/<S>.json, relativa a la página.
function isStaticMode() {
    return Boolean(window.LATAM_RUNTIME && window.LATAM_RUNTIME.staticMode);
}

function parseApiPath(path) {
    const url = new URL(path, window.location.origin);
    return {
        endpoint: url.pathname.replace(/^\/api\//, ''),
        scenario: url.searchParams.get('scenario') || 'S0'
    };
}

function apiUrl(path) {
    if (!isStaticMode()) return path;
    const { endpoint, scenario } = parseApiPath(path);
    return `api/${endpoint}/${encodeURIComponent(scenario)}.json`;
}

// Resultados de las simulaciones ejecutadas desde esta página en Vercel. Solo viven en
// esta pestaña: al recargar se vuelve a los resultados publicados.
const localRunResults = {};

function storeLocalRunResults(scenario, files) {
    localRunResults[scenario] = { files, ranAt: new Date().toISOString() };
}

function localRunResponse(path) {
    const { endpoint, scenario } = parseApiPath(path);
    const run = localRunResults[scenario];
    if (!run) return null;
    const data = window.LatamApiResponses.buildScenarioResponse(endpoint, run.files, run.ranAt);
    if (data === undefined) return null;
    if (data === null) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    const body = endpoint === 'model-status' ? { ...data, local: true } : data;
    return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}

function apiFetch(path, options) {
    if (isStaticMode()) {
        const local = localRunResponse(path);
        if (local) return Promise.resolve(local);
    }
    return fetch(apiUrl(path), options);
}
