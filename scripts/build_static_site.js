// Genera el sitio estático para GitHub Pages: copia public/ y guarda cada respuesta GET
// de la API como api/<endpoint>/<escenario>.json, la ruta que usa public/api_client.js.
// Las respuestas salen del mismo server.js, así que coinciden con las del servidor Express.
//
// Uso: node scripts/build_static_site.js [carpeta_salida]   (por defecto: _site)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.resolve(process.argv[2] || path.join(ROOT, '_site'));
const SCENARIOS_DIR = path.join(ROOT, 'data', 'scenarios');

const app = require(path.join(ROOT, 'server.js'));

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
                if (endpoint === 'model-status' && data.status === 'loaded') {
                    data.lastRun = lastRunDate(scenario) || data.lastRun;
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

    const runtime = {
        staticMode: true,
        runModelUrl: `${repositoryUrl()}/actions/workflows/run-model.yml`
    };
    fs.writeFileSync(
        path.join(OUT_DIR, 'runtime_config.js'),
        `// Generado por scripts/build_static_site.js\nwindow.LATAM_RUNTIME = ${JSON.stringify(runtime)};\n`
    );

    console.log(`Sitio estático en ${OUT_DIR}: ${written} respuestas de API (escenarios: ${scenarios().join(', ')})`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
