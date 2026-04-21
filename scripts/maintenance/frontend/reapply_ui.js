const fs = require('fs');

const filePath = "public/chart_helper.js";
let content = fs.readFileSync(filePath, "utf-8");

// 1. Insert global `let asiaConfigCustomized = false;` next to `let asiaExpostMUSD`
if (!content.includes("let asiaConfigCustomized =")) {
    content = content.replace(
        "let asiaExpostMUSD = true;",
        "let asiaExpostMUSD = true;\n    let asiaConfigCustomized = false;"
    );
}

const startMarker = "<div class=\"res-card-header\" style=\"background:#1e3a8a; color:white;\">Configuración Financiera (ASIA)</div>";
const endMarker = "<button id=\"asia_recalc\" style=\"padding: 6px 16px; background:#2563eb; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;\" onmouseover=\"this.style.background='#1d4ed8'\" onmouseout=\"this.style.background='#2563eb'\">Recalcular</button>";

let idxStart = content.indexOf(startMarker);
let idxEnd = content.indexOf(endMarker);

if (idxStart !== -1 && idxEnd !== -1) {
    const preStr = content.substring(0, idxStart);
    const lastCardIdx = preStr.lastIndexOf('<div class="res-card">');
    
    const snippetEndIdx = idxEnd + endMarker.length;
    let postStr = content.substring(snippetEndIdx);
    
    let closingTags = 0;
    let finalEndIdx = snippetEndIdx;
    for (let i = 0; i < postStr.length - 6; i++) {
        if (postStr.substring(i, i+6) === "</div>") {
            closingTags++;
            if (closingTags === 3) {
                finalEndIdx = snippetEndIdx + i + 6;
                break;
            }
        }
    }

    const preContainerStr = content.substring(0, lastCardIdx);
    const innerHtmlIdx = preContainerStr.lastIndexOf("contentContainer.innerHTML = `");
    
    const preHTML = content.substring(0, innerHtmlIdx);
    const postHTML = content.substring(finalEndIdx);

    const replacementHTML = `        let alphaSum = typeof asiaInputs.alpha_d === 'number' && typeof asiaInputs.alpha_g === 'number' ? (asiaInputs.alpha_d + asiaInputs.alpha_g) : 1;
        let betaSum = typeof asiaInputs.beta_d === 'number' && typeof asiaInputs.beta_g === 'number' ? (asiaInputs.beta_d + asiaInputs.beta_g) : 1;
        let isValidEconomic = (Math.abs(alphaSum - 1.0) < 0.001) && (Math.abs(betaSum - 1.0) < 0.001);
        let badgeBg = asiaConfigCustomized ? '#fef08a' : '#bbf7d0';
        let badgeCol = asiaConfigCustomized ? '#854d0e' : '#166534';
        let badgeTxt = asiaConfigCustomized ? 'Personalizada' : 'Recomendada (' + (asiaExpostMethod === 'stamp' ? 'Stamp' : 'MW-Milla') + ')';
        let restoreDisp = asiaConfigCustomized ? 'inline-block' : 'none';

        contentContainer.innerHTML = \`
            <div class="res-card" style="overflow:visible; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                <div class="res-card-header" style="background:#1e3a8a; color:white;">Configuración Financiera (ASIA)</div>
                <div class="res-card-body" style="background:#f9fafb; display: flex; gap: 15px; align-items: stretch; flex-wrap: wrap;">
                    
                    <!-- Panel 1: Costos del Proyecto -->
                    <div style="flex:1; min-width: 250px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; display:flex; flex-direction:column;">
                        <div style="font-weight:bold; color:#1e40af; border-bottom: 1px solid #bfdbfe; padding:8px 12px; background:#eff6ff;">1. Costos del Proyecto</div>
                        <div style="padding:12px; display:flex; flex-direction:column; gap:8px;">
                            <div style="display:flex; gap: 8px;">
                                <div style="flex:1"><span class="form-label" style="font-weight:600; font-size:0.8rem;">CAPEX (USD) ℹ️</span><input type="number" id="asia_capex" class="form-input" value="\${asiaInputs.capex_usd}"></div>
                                <div style="flex:1"><span class="form-label" style="font-weight:600; font-size:0.8rem;">Años ℹ️</span><input type="number" id="asia_n" class="form-input" value="\${asiaInputs.life_years}"></div>
                            </div>
                            <div style="display:flex; gap: 8px;">
                                <div style="flex:1"><span class="form-label" style="font-weight:600; font-size:0.8rem;">Tasa (r) ℹ️</span><input type="number" id="asia_r" class="form-input" value="\${asiaInputs.r_annual}" step="0.01"></div>
                                <div style="flex:1"><span class="form-label" style="font-weight:600; font-size:0.8rem;">O&M Frac ℹ️</span><input type="number" id="asia_om" class="form-input" value="\${asiaInputs.om_frac_annual}" step="0.01"></div>
                            </div>
                            <label style="display:flex; align-items:center; gap:5px; font-size:13px; font-weight:bold; margin-top: auto; color:#374151;">
                                <input type="checkbox" id="asia_ptoyear" \${asiaProjectToYear ? 'checked' : ''}> Anualizar CAPEX
                            </label>
                        </div>
                    </div>

                    <!-- Panel 2: Metodología Tarifaria -->
                    <div style="flex:1; min-width: 250px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; display:flex; flex-direction:column;">
                        <div style="font-weight:bold; color:#1e40af; border-bottom: 1px solid #bfdbfe; padding:8px 12px; background:#eff6ff;">2. Metodología Tarifaria</div>
                        <div style="padding:12px; display:flex; flex-direction:column; gap:8px;">
                            <div><span class="form-label" style="font-weight:600; font-size:0.8rem;">Método Análisis ℹ️</span><select id="asia_method" class="form-input">
                                <option value="stamp" \${asiaExpostMethod === 'stamp' ? 'selected' : ''}>Sello Postal</option>
                                <option value="mwm" \${asiaExpostMethod === 'mwm' ? 'selected' : ''}>MW-Mile</option>
                            </select></div>
                            <div style="display:flex; gap: 8px;">
                                <div style="flex:1"><span class="form-label" style="font-weight:600; font-size:0.8rem;">Millas Carga ℹ️</span><input type="number" id="asia_miles" class="form-input" value="\${asiaMilesLine}"></div>
                                <div style="flex:1"><span class="form-label" style="font-weight:600; font-size:0.8rem;">Regla MW-Mile ℹ️</span><select id="asia_rule" class="form-input">
                                    <option value="importer_pays" \${asiaMwMileRule === 'importer_pays' ? 'selected' : ''}>Importador Paga</option>
                                    <option value="exporter_pays" \${asiaMwMileRule === 'exporter_pays' ? 'selected' : ''}>Exportador Paga</option>
                                    <option value="split_50_50" \${asiaMwMileRule === 'split_50_50' ? 'selected' : ''}>50% / 50%</option>
                                </select></div>
                            </div>
                        </div>
                    </div>

                    <!-- Panel 3: Reglas Regulatorias Ex-Post -->
                    <div style="flex:2; min-width: 320px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; display:flex; flex-direction:column;">
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #bfdbfe; padding:8px 12px; background:#eff6ff;">
                            <div style="font-weight:bold; color:#1e40af;">3. Reglas de Asignación Ex-Post</div>
                            <span id="asia_badge" style="font-size:11px; background:\${badgeBg}; color:\${badgeCol}; padding:2px 6px; border-radius:12px; font-weight:bold; display:inline-block;">\${badgeTxt}</span>
                        </div>
                        <div style="padding:12px; display:flex; flex-direction:column; gap:8px; flex:1;">
                            <div style="display:flex; gap:10px;">
                                <div style="flex:1; border:1px solid #e5e7eb; padding:8px; border-radius:4px; background:#f9fafb;">
                                    <div style="font-size:12px; font-weight:bold; color:#4b5563; margin-bottom:4px;" title="Regla de asignación del peaje físico a pagar.">Regla Peaje (α)</div>
                                    <div style="display:flex; gap:4px;">
                                        <div style="flex:1"><span class="form-label" style="font-weight:500; font-size:0.8rem;">α Demanda</span><input type="number" id="asia_alpha_d" class="form-input" style="padding:4px; font-size:0.85rem;" value="\${asiaInputs.alpha_d}" step="0.1"></div>
                                        <div style="flex:1"><span class="form-label" style="font-weight:500; font-size:0.8rem;">α Generador</span><input type="number" id="asia_alpha_g" class="form-input" style="padding:4px; font-size:0.85rem;" value="\${asiaInputs.alpha_g}" step="0.1"></div>
                                    </div>
                                </div>
                                <div style="flex:1; border:1px solid #e5e7eb; padding:8px; border-radius:4px; background:#f9fafb;">
                                    <div style="font-size:12px; font-weight:bold; color:#4b5563; margin-bottom:4px;" title="Regla sobre quién recibe el beneficio por renta.">Regla Renta (β)</div>
                                    <div style="display:flex; gap:4px;">
                                        <div style="flex:1"><span class="form-label" style="font-weight:500; font-size:0.8rem;">β Demanda</span><input type="number" id="asia_beta_d" class="form-input" style="padding:4px; font-size:0.85rem;" value="\${asiaInputs.beta_d}" step="0.1"></div>
                                        <div style="flex:1"><span class="form-label" style="font-weight:500; font-size:0.8rem;">β Generador</span><input type="number" id="asia_beta_g" class="form-input" style="padding:4px; font-size:0.85rem;" value="\${asiaInputs.beta_g}" step="0.1"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top: auto; padding-top:4px; gap: 8px;">
                                <button id="asia_restore_btn" style="font-size:12px; background:#f3f4f6; color:#374151; border:1px solid #d1d5db; padding:6px 10px; border-radius:4px; cursor:pointer; display:\${restoreDisp}; font-weight:600;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">↺ Restaurar recomendada</button>
                                <span style="flex:1"></span>
                                <button id="asia_recalc" \${!isValidEconomic ? 'disabled' : ''} style="padding: 8px 16px; background:\${isValidEconomic ? '#2563eb' : '#9ca3af'}; color:white; border:none; border-radius:4px; font-weight:bold; cursor:\${isValidEconomic ? 'pointer' : 'not-allowed'}; box-shadow:0 2px 4px rgba(0,0,0,0.1);">Recalcular Resultados</button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Alerta Oculta/Visible -->
                <div id="asia_validation_warn" style="background:#fef2f2; border-top:1px solid #fecaca; color:#b91c1c; padding:10px 16px; font-size:13px; font-weight:bold; display:\${!isValidEconomic ? 'flex' : 'none'}; align-items:center; gap:8px;">⚠️ Los parámetros proporcionales α o β no cumplen consistencia económica (la sumatoria debe ser 1.0). Ajuste los valores para realizar el cálculo.</div>
            </div>`;

    content = preHTML + replacementHTML + postHTML;
    console.log("HTML replaced dynamically!");
} else {
    console.log("Could not find markers.", idxStart, idxEnd);
}

const jsTarget = `        document.getElementById('asia_recalc').onclick = () => {`;
const jsReplacement = `        const checkValidation = () => {
            const ad = Number(document.getElementById('asia_alpha_d').value);
            const ag = Number(document.getElementById('asia_alpha_g').value);
            const bd = Number(document.getElementById('asia_beta_d').value);
            const bg = Number(document.getElementById('asia_beta_g').value);
            
            const isValid = (Math.abs((ad + ag) - 1.0) < 0.001) && (Math.abs((bd + bg) - 1.0) < 0.001);
            const btn = document.getElementById('asia_recalc');
            const warn = document.getElementById('asia_validation_warn');
            
            if (isValid) {
                btn.disabled = false;
                btn.style.background = '#2563eb';
                btn.style.cursor = 'pointer';
                if(warn) warn.style.display = 'none';
            } else {
                btn.disabled = true;
                btn.style.background = '#9ca3af';
                btn.style.cursor = 'not-allowed';
                if(warn) warn.style.display = 'flex';
            }
            
            // Track customization against defaults
            if (Math.abs(ad - 1) > 0.001 || Math.abs(ag - 0) > 0.001 || Math.abs(bd - 0.5) > 0.001 || Math.abs(bg - 0.5) > 0.001) {
                asiaConfigCustomized = true;
                const badge = document.getElementById('asia_badge');
                if (badge) {
                    badge.innerHTML = 'Personalizada';
                    badge.style.background = '#fef08a';
                    badge.style.color = '#854d0e';
                }
                const rest = document.getElementById('asia_restore_btn');
                if (rest) rest.style.display = 'inline-block';
            }
        };

        ['asia_alpha_d', 'asia_alpha_g', 'asia_beta_d', 'asia_beta_g'].forEach(id => {
            const element = document.getElementById(id);
            if(element) element.addEventListener('input', checkValidation);
        });
        
        const methodSelect = document.getElementById('asia_method');
        if (methodSelect) {
            methodSelect.addEventListener('change', (e) => {
                if (!asiaConfigCustomized) {
                    document.getElementById('asia_alpha_d').value = 1.0;
                    document.getElementById('asia_alpha_g').value = 0.0;
                    document.getElementById('asia_beta_d').value = 0.5;
                    document.getElementById('asia_beta_g').value = 0.5;
                    checkValidation();
                }
            });
        }
        
        const btnRestore = document.getElementById('asia_restore_btn');
        if (btnRestore) {
            btnRestore.addEventListener('click', () => {
                asiaConfigCustomized = false;
                document.getElementById('asia_alpha_d').value = 1.0;
                document.getElementById('asia_alpha_g').value = 0.0;
                document.getElementById('asia_beta_d').value = 0.5;
                document.getElementById('asia_beta_g').value = 0.5;
                
                const methodVal = document.getElementById('asia_method').value;
                const badge = document.getElementById('asia_badge');
                if (badge) {
                    badge.innerHTML = 'Recomendada (' + (methodVal === 'stamp' ? 'Stamp' : 'MW-Milla') + ')';
                    badge.style.background = '#bbf7d0';
                    badge.style.color = '#166534';
                }
                btnRestore.style.display = 'none';
                checkValidation();
                // Opcional: invocar recalculo automático
                // document.getElementById('asia_recalc').click();
            });
        }
        
        document.getElementById('asia_recalc').onclick = () => {`;

if (content.includes(jsTarget)) {
    content = content.replace(jsTarget, jsReplacement);
    console.log("JS replaced.");
} else {
    console.error("JS not found.");
}

fs.writeFileSync(filePath, content, "utf-8");
console.log("Done.");
