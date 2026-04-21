with open('public/chart_helper.js', 'r', encoding='utf-8') as f:
    orig = f.read()

new_func = """
// Function to load and display semestral generators summary
function showGeneratorsSummarySemestral(countryName) {
    if (!countryName) return;

    const modalId = 'gens-summary-semestral-modal';
    let modal = createModal(modalId, 2005); // high z-index

    modal.innerHTML = '';
    modal.style.width = '95%';
    modal.style.maxWidth = '1400px';
    modal.style.height = '85vh';
    modal.style.flexDirection = 'column';

    const headerContainer = document.createElement('div');
    headerContainer.style.display = 'flex';
    headerContainer.style.justifyContent = 'space-between';
    headerContainer.style.alignItems = 'center';
    headerContainer.style.width = '100%';
    headerContainer.style.marginBottom = '15px';

    const title = document.createElement('h2');
    title.textContent = `Resumen de Generación Semestral - ${countryName}`;
    title.style.margin = '0';
    title.style.color = '#333';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cerrar';
    closeBtn.style.cssText = `
        padding: 5px 15px;
        cursor: pointer;
        background-color: #f44336;
        color: white;
        border: none;
        border-radius: 4px;
    `;
    closeBtn.onclick = () => modal.style.display = 'none';

    headerContainer.appendChild(title);
    headerContainer.appendChild(closeBtn);
    modal.appendChild(headerContainer);

    const tablesContainer = document.createElement('div');
    tablesContainer.style.display = 'flex';
    tablesContainer.style.flexDirection = 'row';
    tablesContainer.style.gap = '20px';
    tablesContainer.style.flexGrow = '1';
    tablesContainer.style.overflow = 'hidden';

    const createSemestralTable = (titleText) => {
        const container = document.createElement('div');
        container.style.flex = '1';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.overflowY = 'auto';
        container.style.border = '1px solid #ddd';
        container.style.borderRadius = '4px';
        container.style.background = '#fafafa';

        const h3 = document.createElement('h3');
        h3.textContent = titleText;
        h3.style.textAlign = 'center';
        h3.style.margin = '10px 0';

        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-family: sans-serif;
            font-size: 0.8em;
        `;
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background-color: #f2f2f2; text-align: left;">
                <th style="padding: 10px; border-bottom: 2px solid #ddd; position: sticky; top: 0; background: #eee;">Nombre Nodo</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; position: sticky; top: 0; background: #eee;">Tecnología</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; position: sticky; top: 0; background: #eee;">Producción (MWh)</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; position: sticky; top: 0; background: #eee;">Revenue (USD)</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; position: sticky; top: 0; background: #eee;">Var Cost (USD)</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; position: sticky; top: 0; background: #eee;">Profit (USD)</th>
            </tr>
        `;
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);

        container.appendChild(h3);
        container.appendChild(table);
        return { container, tbody };
    };

    const s1 = createSemestralTable('Semestre 1');
    const s2 = createSemestralTable('Semestre 2');

    tablesContainer.appendChild(s1.container);
    tablesContainer.appendChild(s2.container);
    modal.appendChild(tablesContainer);

    ['energy-chart-modal', 'flow-chart-modal', 'gen-chart-modal', 'mc-chart-modal', 'gens-summary-modal'].forEach(id => {
        const m = document.getElementById(id);
        if (m) m.style.display = 'none';
    });

    modal.style.display = 'flex';

    const scenario = document.getElementById('visualize-scenario') ? document.getElementById('visualize-scenario').value : 'S0';

    const populateTable = (tbody, gens) => {
        if (!gens || gens.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #777;">No hay datos</td></tr>`;
            return;
        }
        gens.sort((a, b) => a.tech.localeCompare(b.tech) || a.name.localeCompare(b.name));
        let rowsHtml = '';
        gens.forEach(g => {
            const formatNumber = (num, min=0, max=2) => {
                const val = Number(num);
                if (isNaN(val)) return '0.00';
                return val.toLocaleString(undefined, { minimumFractionDigits: min, maximumFractionDigits: max });
            };
            rowsHtml += `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 10px;">${g.name}</td>
                    <td style="padding: 10px;">${g.tech}</td>
                    <td style="padding: 10px;">${formatNumber(g.prod, 2, 2)}</td>
                    <td style="padding: 10px; color: green;">$${formatNumber(g.rev, 2, 2)}</td>
                    <td style="padding: 10px; color: red;">-$${formatNumber(g.total_var_cost, 2, 2)}</td>
                    <td style="padding: 10px; font-weight: bold; color: ${g.profit >= 0 ? '#1b5e20' : '#b71c1c'}">
                        $${formatNumber(g.profit, 2, 2)}
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = rowsHtml;
    };

    Promise.all([
        fetch('/api/generators-sem1?scenario=' + scenario).then(res => res.ok ? res.json() : null),
        fetch('/api/generators-sem2?scenario=' + scenario).then(res => res.ok ? res.json() : null)
    ])
    .then(([data1, data2]) => {
        populateTable(s1.tbody, data1 ? (data1[countryName] || []) : []);
        populateTable(s2.tbody, data2 ? (data2[countryName] || []) : []);
    })
    .catch(err => {
        console.error(err);
        alert("Error cargando el resumen semestral.");
        modal.style.display = 'none';
    });
}
"""
if 'showGeneratorsSummarySemestral(' not in orig:
    orig += '\n' + new_func
    with open('public/chart_helper.js', 'w', encoding='utf-8') as f:
        f.write(orig)
    print('Function added.')
else:
    print('Function already exists.')
