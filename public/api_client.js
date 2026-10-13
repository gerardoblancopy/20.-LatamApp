// Acceso a la API compartido por script.js y chart_helper.js.
// En modo estático (GitHub Pages) cada respuesta de /api/<endpoint>?scenario=<S>
// está pre-generada como api/<endpoint>/<S>.json, relativa a la página.
function isStaticMode() {
    return Boolean(window.LATAM_RUNTIME && window.LATAM_RUNTIME.staticMode);
}

function apiUrl(path) {
    if (!isStaticMode()) return path;
    const url = new URL(path, window.location.origin);
    const endpoint = url.pathname.replace(/^\/api\//, '');
    const scenario = url.searchParams.get('scenario') || 'S0';
    return `api/${endpoint}/${encodeURIComponent(scenario)}.json`;
}

function apiFetch(path, options) {
    return fetch(apiUrl(path), options);
}
