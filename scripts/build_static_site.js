// Genera el sitio estático para GitHub Pages y Vercel: copia public/ y guarda cada respuesta
// GET de la API como api/<endpoint>/<escenario>.json, la ruta que usa public/api_client.js.
// Las respuestas salen del mismo server.js, así que coinciden con las del servidor Express.
// En Vercel (VERCEL=1) el botón "Ejecutar modelo" usa la función api/run_model.py; en
// Pages muestra cómo lanzar el workflow de GitHub Actions.
//
// Uso: node scripts/build_static_site.js [carpeta_salida]   (por defecto: _site)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.resolve(process.argv[2] || path.join(ROOT, '_site'));
const SCENARIOS_DIR = path.join(ROOT, 'data', 'scenarios');

const app = require(path.join(ROOT, 'server.js'));
const { buildScenarioResponse } = require(path.join(ROOT, 'public', 'api_responses.js'));

// Endpoints GET declarados en server.js, para no mantener una segunda lista
function apiEndpoints() {
    const source = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
    return [...source.matchAll(/app\.get\('\/api\/([\w-]+)'/g)].map(match => match[1]);
}

function scenarios() {
    return fs.readdirSync(SCENARIOS_DIR, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
}

// En un checkout de CI la fecha de modificación de los archivos es la del clon,
// así que la "última simulación" se toma del último commit que cambió los resultados.
// Sin historial de git (los builds de Vercel no lo traen) devuelve null.
function lastRunDate(scenario) {
    const file = path.join('data', 'scenarios', scenario, 'lines_processed.json');
    try {
        return execFileSync('git', ['log', '-1', '--format=%cI', '--', file], { cwd: ROOT, encoding: 'utf8' }).trim() || null;
    } catch {
        return null;
    }
}

function repositoryUrl() {
    if (process.env.GITHUB_REPOSITORY) {
        return `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}`;
    }
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: ROOT, encoding: 'utf8' }).trim();
    return remote.replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '');
}

function readScenarioFiles(scenario) {
    const dir = path.join(SCENARIOS_DIR, scenario);
    const files = {};
    for (const name of fs.readdirSync(dir).filter(name => name.endsWith('.json'))) {
        files[name] = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    }
    return files;
}

// Lo que el navegador arma con public/api_responses.js tras una simulación en Vercel
// debe ser igual a lo que responde server.js con los mismos archivos
function checkSharedResponses(endpoint, scenario, serverData) {
    const shared = buildScenarioResponse(endpoint, readScenarioFiles(scenario), serverData.lastRun);
    if (shared === undefined) return;
    if (JSON.stringify(shared) !== JSON.stringify(serverData)) {
        throw new Error(`public/api_responses.js no coincide con server.js en /api/${endpoint}?scenario=${scenario}`);
    }
}

function runtimeConfig() {
    if (process.env.VERCEL) {
        return { staticMode: true, runModel: 'serverless' };
    }
    return {
        staticMode: true,
        runModel: 'actions',
        runModelUrl: `${repositoryUrl()}/actions/workflows/run-model.yml`
    };
}

async function main() {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
    fs.cpSync(path.join(ROOT, 'public'), OUT_DIR, { recursive: true, filter: src => !src.endsWith('.bak') });

    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => server.once('listening', resolve).once('error', reject));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    let written = 0;
    try {
        for (const endpoint of apiEndpoints()) {
            for (const scenario of scenarios()) {
                const res = await fetch(`${baseUrl}/api/${endpoint}?scenario=${encodeURIComponent(scenario)}`);
                // Sin archivo de resultados el servidor responde 404; en Pages también será 404
                if (!res.ok) continue;
                const data = await res.json();
                checkSharedResponses(endpoint, scenario, data);
                if (endpoint === 'model-status' && data.status === 'loaded') {
                    // La fecha de modificación sería la del clon: sin git, mejor no mostrar fecha
                    const date = lastRunDate(scenario);
                    if (date) data.lastRun = date;
                    else delete data.lastRun;
                }
                const file = path.join(OUT_DIR, 'api', endpoint, `${scenario}.json`);
                fs.mkdirSync(path.dirname(file), { recursive: true });
                fs.writeFileSync(file, JSON.stringify(data));
                written++;
            }
        }
    } finally {
        server.close();
    }

    fs.writeFileSync(
        path.join(OUT_DIR, 'runtime_config.js'),
        `// Generado por scripts/build_static_site.js\nwindow.LATAM_RUNTIME = ${JSON.stringify(runtimeConfig())};\n`
    );

    console.log(`Sitio estático en ${OUT_DIR}: ${written} respuestas de API (escenarios: ${scenarios().join(', ')})`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
