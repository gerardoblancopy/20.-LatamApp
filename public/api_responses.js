// Respuestas de /api/<endpoint> a partir de los archivos de resultados de un escenario
// (data/scenarios/<S>/). Las usa server.js y, en Vercel, el navegador para mostrar una
// simulación recién ejecutada sin servidor. scripts/build_static_site.js comprueba que
// las dos versiones devuelvan lo mismo.
(function (exports) {
    // Endpoints que devuelven un archivo del escenario tal cual
    const SCENARIO_FILES = {
        flows: 'flows_results.json',
        'transmission-investment': 'tx_investment.json',
        'tx-investment': 'tx_investment.json',
        generators: 'generators_summary.json',
        'generators-sem1': 'generators_summary_sem1.json',
        'generators-sem2': 'generators_summary_sem2.json',
        demand: 'demand_summary.json',
        'demand-sem1': 'demand_summary_sem1.json',
        'demand-sem2': 'demand_summary_sem2.json',
        storage: 'storage_summary.json',
        generation: 'generation_results.json',
        'marginal-costs': 'marginal_costs.json'
    };
    const LINES_FILE = 'lines_processed.json';

    function parseFlowP1(row) {
        const value =
            row['Flow_P1'] ??
            row['Flow P1'] ??
            row['flowP1'] ??
            row['flow_p1'] ??
            row['Flujo_P1'] ??
            row['Flujo P1'];
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : undefined;
    }

    // Fila de lines_processed.json (salida del modelo) -> línea del mapa
    function mapProcessedLine(row) {
        return {
            id: row['ID'],
            name: row['Nombre'] || 'Sin Nombre',
            status: row['Estado'],
            fmaxDirect: row['Fmax directo (MW)'],
            fmaxInverse: row['Fmax inverso (MW)'],
            start: {
                lat: parseFloat(row['lat_ini']),
                lon: parseFloat(row['lon_ini']),
                node: row['Nodo_ini'],
                country: row['pais_ini']
            },
            end: {
                lat: parseFloat(row['lat_fin']),
                lon: parseFloat(row['lon_fin']),
                node: row['Nodo_fin'],
                country: row['pais_fin']
            },
            deltaD: row['delta_D'],
            factorUtilizacion: row['Factor utilizacion pais'],
            X_LN: row['X_LN'],
            flowP1: parseFlowP1(row),
            inversionMUSD: row['Inversion total sin anualizar (MUSD)']
        };
    }

    function hasValidCoordinates(line) {
        return !isNaN(line.start.lat) && !isNaN(line.start.lon) &&
            !isNaN(line.end.lat) && !isNaN(line.end.lon);
    }

    // Respuesta de /api/<endpoint> para un escenario, dados sus archivos {nombre: contenido}.
    // null equivale a un 404 del servidor; undefined, a un endpoint que no depende del escenario.
    function buildScenarioResponse(endpoint, files, lastRun) {
        if (endpoint === 'lines') {
            return files[LINES_FILE] ? files[LINES_FILE].map(mapProcessedLine).filter(hasValidCoordinates) : null;
        }
        if (endpoint === 'model-status') {
            return files[LINES_FILE] ? { status: 'loaded', lastRun } : { status: 'not_loaded' };
        }
        if (Object.prototype.hasOwnProperty.call(SCENARIO_FILES, endpoint)) {
            return files[SCENARIO_FILES[endpoint]] ?? null;
        }
        return undefined;
    }

    Object.assign(exports, {
        SCENARIO_FILES,
        LINES_FILE,
        parseFlowP1,
        mapProcessedLine,
        hasValidCoordinates,
        buildScenarioResponse
    });
})(typeof module !== 'undefined' && module.exports ? module.exports : (window.LatamApiResponses = {}));
