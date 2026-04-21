const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', '..', 'public', 'chart_helper.js');
let content = fs.readFileSync(targetFile, 'utf8');

// We use regular expressions to extract the HTML injection part

const htmlPattern = /<div style="margin-bottom: 24px;">[\s\S]*?(?=document\.getElementById\('sie_recalc'\)\.onclick = \(\) => \{)/;

let newHTMLInsideTemplate = `
            \`; // End the first block of HTML

            contentContainer.innerHTML += \`
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; margin-top: 10px;">
                <div style="display:flex; align-items:center; gap: 8px;">
                    <span style="font-size:0.9em; font-weight:bold; color: #1e3a8a;">Unidad Opciones Ex-Post:</span>
                    <select id="sie_expost_unit" style="padding:4px; font-weight:bold; cursor:pointer; color: #1e3a8a; border: 1px solid #93c5fd; border-radius: 4px;" onchange="siepacExpostMUSD = this.value === 'MUSD'; document.getElementById('sie_recalc').click();">
                        <option value="MUSD" \${siepacExpostMUSD ? 'selected' : ''}>MUSD</option>
                        <option value="USD" \${!siepacExpostMUSD ? 'selected' : ''}>USD</option>
                    </select>
                </div>
            </div>
            \`;
            contentContainer.innerHTML += generateExPostHTML(1);
            contentContainer.innerHTML += generateExPostHTML(2);
            
        `;

if (!htmlPattern.test(content)) {
    console.error("HTML block not found!");
    process.exit(1);
}

// Replace the HTML string
content = content.replace(htmlPattern, newHTMLInsideTemplate);

// Now we need to replace \`calculateExPostSIEPAC\` logic.
const logicPattern = /const calculateExPostSIEPAC = \(isCon\) => \{[\s\S]*?(?=let targetIsExp = siepacTargetCountry === expC;)/;

const newLogicBlock = `
        function getCountryStatsSlice(country, genData, demData, sem_idx) {
            let stats = { genProfit: 0, genRevenue: 0, varCost: 0, prod: 0, cap: 0, demandCost: 0, demandEns: 0, demandMW: 0 };
            if (genData && genData[country]) {
                let all = genData[country];
                let half = Math.floor(all.length / 2);
                let start = sem_idx === 1 ? 0 : half;
                let end = sem_idx === 1 ? half : all.length;
                for(let i=start; i<end; i++) {
                    let g = all[i];
                    stats.genProfit += (g.profit || 0); stats.genRevenue += (g.rev || 0);
                    stats.varCost += (g.total_var_cost || 0); stats.prod += (g.prod || 0);
                }
            }
            if (demData && demData[country]) {
                let all = demData[country];
                let half = Math.floor(all.length / 2);
                let start = sem_idx === 1 ? 0 : half;
                let end = sem_idx === 1 ? half : all.length;
                for(let i=start; i<end; i++) {
                    let d = all[i];
                    stats.demandCost += (d.demand_cost || 0);
                    stats.demandMW += (d.demand || 0);
                }
            }
            stats.opCost = stats.varCost;
            return stats;
        }

        const calcSemestralParams = (sem) => {
            let sFlows = sem === 1 ? fullFlows.slice(0, halfCount) : fullFlows.slice(halfCount);
            let sF = sFlows.length > 0 ? (sFlows.reduce((a, b) => a + b, 0) / sFlows.length) : 0;
            let sum_abs_s = 0;
            if (sFlows.length > 0) {
                for (let f of sFlows) {
                    sum_abs_s += Math.abs(f);
                }
            }
            let s_division_horas = fullFlows.length > 0 ? (8760 / fullFlows.length) : 100;
            let sum_abs_f_MWh_s = sum_abs_s * s_division_horas;
            
            let s_uso = 0;
            if (sFlows.length > 0) {
                s_uso = sum_abs_s / (capacity * sFlows.length);
                s_uso = Math.min(s_uso, 1.0);
            }
            
            let s_renta = sem === 1 ? (siepacInputs.CVTn_s1_USD || 0) : (siepacInputs.CVTn_s2_USD || 0);
            let s_ir_raw = (IAR_annual / 2) + (siepacInputs.SCF_USD - siepacInputs.SCE_USD) - s_renta - siepacInputs.IVDT_USD;
            let s_ir = Math.max(0, s_ir_raw);
            
            let s_P = s_ir * s_uso;
            let s_CC = s_ir * (1 - s_uso);
            let s_MR = s_P + s_CC;
            
            let s_MR_allocated = s_MR * aR;
            let s_MI_allocated = s_MR * aI;
            
            let s_expC = sF >= 0 ? globalData.expCountry : globalData.impCountry;
            let s_impC = sF >= 0 ? globalData.impCountry : globalData.expCountry;
            
            return { s_expC, s_impC, s_MR_allocated, s_MI_allocated, sum_abs_f_MWh_s, s_renta };
        };

        const calculateExPostSIEPAC_Semestral = (isCon, sem) => {
            const context = calcSemestralParams(sem);
            let statsE = getCountryStatsSlice(context.s_expC, isCon ? globalData.genS1 : globalData.genS0, isCon ? globalData.demS1 : globalData.demS0, sem);
            let statsI = getCountryStatsSlice(context.s_impC, isCon ? globalData.genS1 : globalData.genS0, isCon ? globalData.demS1 : globalData.demS0, sem);

            let Rc_sem_E = (statsE.demandMW || 1); // Not annualized
            let Ig_sem_E = (statsE.prod || 1); 
            let Rc_sem_I = (statsI.demandMW || 1); 
            let Ig_sem_I = (statsI.prod || 1); 

            let curtrc_exp = Rc_sem_E > 0 ? context.s_MR_allocated / Rc_sem_E : 0;
            let curtrg_exp = Ig_sem_E > 0 ? context.s_MI_allocated / Ig_sem_E : 0;
            let curtrc_imp = Rc_sem_I > 0 ? context.s_MR_allocated / Rc_sem_I : 0;
            let curtrg_imp = Ig_sem_I > 0 ? context.s_MI_allocated / Ig_sem_I : 0;

            let op_cost_h_e = statsE.opCost; // Already semestral
            let op_cost_h_i = statsI.opCost;
            let profit_h_e = statsE.genProfit;
            let profit_h_i = statsI.genProfit;
            let demand_cost_h_e = statsE.demandCost;
            let demand_cost_h_i = statsI.demandCost;

            let peaje_iny_exp_USD = isCon ? curtrg_exp * context.sum_abs_f_MWh_s : 0;
            let peaje_ret_imp_USD = isCon ? curtrc_imp * context.sum_abs_f_MWh_s : 0;
            let CR_abs = isCon ? context.s_renta : 0;

            const ben_soc_exp = op_cost_h_e + peaje_iny_exp_USD;
            const ben_soc_imp = op_cost_h_i + peaje_ret_imp_USD;
            const ben_gen_exp = profit_h_e - peaje_iny_exp_USD + CR_abs * aI;
            const ben_gen_imp = profit_h_i;
            const cos_dem_exp = demand_cost_h_e;
            const cos_dem_imp = demand_cost_h_i + peaje_ret_imp_USD - CR_abs * aR;

            return {
                ben_soc_exp, ben_soc_imp, ben_gen_exp, ben_gen_imp, cos_dem_exp, cos_dem_imp,
                peaje_iny_exp_USD, peaje_ret_imp_USD, curtrc_exp, curtrg_exp, curtrc_imp, curtrg_imp,
                op_cost_h_e, op_cost_h_i, profit_h_e, profit_h_i, demand_cost_h_e, demand_cost_h_i,
                CR_abs, expC: context.s_expC, impC: context.s_impC
            };
        };

        const generateExPostHTML = (sem) => {
            const conData = calculateExPostSIEPAC_Semestral(true, sem);
            const sinData = calculateExPostSIEPAC_Semestral(false, sem);

            let deltaBsE = conData.ben_soc_exp - sinData.ben_soc_exp;
            let deltaBsI = conData.ben_soc_imp - sinData.ben_soc_imp;
            let deltaBgE = conData.ben_gen_exp - sinData.ben_gen_exp;
            let deltaBgI = conData.ben_gen_imp - sinData.ben_gen_imp;
            let deltaCdE = conData.cos_dem_exp - sinData.cos_dem_exp;
            let deltaCdI = conData.cos_dem_imp - sinData.cos_dem_imp;

            let expC = conData.expC;
            let impC = conData.impC;

            return \`
            <div style="margin-bottom: 24px; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 2px solid \${sem === 1 ? '#eab308' : '#3b82f6'}; padding-bottom: 8px;">
                    <h3 style="margin-bottom: 0; font-size: 1.15rem; font-weight: 700; color: #1e293b;">Análisis Adicional: 3 Modelos Ex-Post (Semestre \${sem})</h3>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
                    <!-- CASO SIN -->
                    <div class="res-card" style="margin-bottom: 0; border-top: 4px solid #9ca3af; box-shadow: none; border: 1px solid #cbd5e1;">
                        <div class="res-card-header" style="background: #f3f4f6; font-size: 0.9em;">\${createTooltipHTML('1. Caso Base (SIN)', 'Situación del país atendienda la demanda aisladamente', 'F = 0')}</div>
                        <div class="res-card-body" style="padding: 0;">
                            <table class="res-table" style="font-size: 0.85em;">
                                <thead><tr><th style="padding: 8px 12px; font-size: 0.8em;">\${siepacExpostMUSD ? 'MUSD' : 'USD'}</th><th style="padding: 8px 12px; font-size: 0.8em;">Exp: \${expC}</th><th style="padding: 8px 12px; font-size: 0.8em;">Imp: \${impC}</th></tr></thead>
                                <tbody>
                                    <tr><td style="padding: 8px 12px;">Costo Operación</td><td style="padding: 8px 12px;">\${createTooltipHTML(formatCur(sinData.ben_soc_exp), 'Costo Op', formatCur(sinData.op_cost_h_e), 'right')}</td><td style="padding: 8px 12px;">\${createTooltipHTML(formatCur(sinData.ben_soc_imp), 'Costo Op', formatCur(sinData.op_cost_h_i), 'right')}</td></tr>
                                    <tr><td style="padding: 8px 12px;">Beneficio Generador</td><td style="padding: 8px 12px; color:#15803d;">\${createTooltipHTML(formatCur(sinData.ben_gen_exp), 'Ben Gen', formatCur(sinData.profit_h_e), 'right')}</td><td style="padding: 8px 12px; color:#15803d;">\${createTooltipHTML(formatCur(sinData.ben_gen_imp), 'Ben Gen', formatCur(sinData.profit_h_i), 'right')}</td></tr>
                                    <tr><td style="padding: 8px 12px;">Costo Demanda</td><td style="padding: 8px 12px; color:#dc2626;">\${createTooltipHTML(formatCur(sinData.cos_dem_exp), 'Costo Dem', formatCur(sinData.demand_cost_h_e), 'right')}</td><td style="padding: 8px 12px; color:#dc2626;">\${createTooltipHTML(formatCur(sinData.cos_dem_imp), 'Costo Dem', formatCur(sinData.demand_cost_h_i), 'right')}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <!-- CASO CON -->
                    <div class="res-card" style="margin-bottom: 0; border-top: 4px solid #3b82f6; box-shadow: none; border: 1px solid #cbd5e1;">
                        <div class="res-card-header" style="background: #eff6ff; color: #1e3a8a; font-size: 0.9em;">\${createTooltipHTML('2. Caso Interconectado (CON)', 'Situación del país despachado regionalmente con rentas y peajes', 'F + Peajes + Δ Rentas')}</div>
                        <div class="res-card-body" style="padding: 0;">
                            <table class="res-table" style="font-size: 0.85em;">
                                <thead><tr><th style="padding: 8px 12px; font-size: 0.8em;">\${siepacExpostMUSD ? 'MUSD' : 'USD'}</th><th style="padding: 8px 12px; font-size: 0.8em;">Exp: \${expC}</th><th style="padding: 8px 12px; font-size: 0.8em;">Imp: \${impC}</th></tr></thead>
                                <tbody>
                                    <tr><td style="padding: 8px 12px;">Op + Peaje</td><td style="padding: 8px 12px;">\${createTooltipHTML(formatCur(conData.ben_soc_exp), 'Op + Peaje', formatCur(conData.op_cost_h_e) + ' + ' + formatCur(conData.peaje_iny_exp_USD), 'right')}</td><td style="padding: 8px 12px;">\${createTooltipHTML(formatCur(conData.ben_soc_imp), 'Op + Peaje', formatCur(conData.op_cost_h_i) + ' + ' + formatCur(conData.peaje_ret_imp_USD), 'right')}</td></tr>
                                    <tr><td style="padding: 8px 12px;">Ben Gen + Renta - Peaje</td><td style="padding: 8px 12px; color:#15803d;">\${createTooltipHTML(formatCur(conData.ben_gen_exp), 'Profit - Peaje + Renta', formatCur(conData.profit_h_e) + ' - ' + formatCur(conData.peaje_iny_exp_USD) + ' + ' + formatCur(conData.CR_abs * aI), 'right')}</td><td style="padding: 8px 12px; color:#15803d;">\${createTooltipHTML(formatCur(conData.ben_gen_imp), 'Profit', formatCur(conData.profit_h_i), 'right')}</td></tr>
                                    <tr><td style="padding: 8px 12px;">Dem + Peaje - Renta</td><td style="padding: 8px 12px; color:#dc2626;">\${createTooltipHTML(formatCur(conData.cos_dem_exp), 'Demanda', formatCur(conData.demand_cost_h_e), 'right')}</td><td style="padding: 8px 12px; color:#dc2626;">\${createTooltipHTML(formatCur(conData.cos_dem_imp), 'Dem + Peaje - Renta', formatCur(conData.demand_cost_h_i) + ' + ' + formatCur(conData.peaje_ret_imp_USD) + ' - ' + formatCur(conData.CR_abs * aR), 'right')}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <!-- DELTAS -->
                    <div class="res-card" style="margin-bottom: 0; border-top: 4px solid #8b5cf6; box-shadow: none; border: 1px solid #cbd5e1;">
                        <div class="res-card-header" style="background: #f5f3ff; color: #4c1d95; font-size: 0.9em;">\${createTooltipHTML('3. Ganadores y perdedores (Δ)', 'Diferencial neto del beneficio/coste entre CON y SIN', 'Valor CON vs Valor SIN')}</div>
                        <div class="res-card-body" style="padding: 0;">
                            <table class="res-table" style="font-size: 0.85em;">
                                <thead><tr><th style="padding: 8px 12px; font-size: 0.8em;">\${siepacExpostMUSD ? 'MUSD' : 'USD'}</th><th style="padding: 8px 12px; font-size: 0.8em;">Exp: \${expC}</th><th style="padding: 8px 12px; font-size: 0.8em;">Imp: \${impC}</th></tr></thead>
                                <tbody>
                                    <tr><td style="padding: 8px 12px;">Δ Costo Operación</td><td style="padding: 8px 12px; font-weight: \${deltaBsE < 0 ? 'bold' : 'normal'}; color:\${deltaBsE < 0 ? '#16a34a' : '#ef4444'}">\${deltaBsE < 0 ? 'Ganador' : 'Perdedor'} \${createTooltipHTML('(' + formatExpost(deltaBsE) + ')', 'Δ', formatExpost(conData.ben_soc_exp) + ' - ' + formatExpost(sinData.ben_soc_exp), 'right')}</td><td style="padding: 8px 12px; font-weight: \${deltaBsI < 0 ? 'bold' : 'normal'}; color:\${deltaBsI < 0 ? '#16a34a' : '#ef4444'}">\${deltaBsI < 0 ? 'Ganador' : 'Perdedor'} \${createTooltipHTML('(' + formatExpost(deltaBsI) + ')', 'Δ', formatExpost(conData.ben_soc_imp) + ' - ' + formatExpost(sinData.ben_soc_imp), 'right')}</td></tr>
                                    <tr><td style="padding: 8px 12px;">Δ Ben Generador</td><td style="padding: 8px 12px; font-weight: \${deltaBgE > 0 ? 'bold' : 'normal'}; color:\${deltaBgE > 0 ? '#16a34a' : '#ef4444'}">\${deltaBgE > 0 ? 'Ganador' : 'Perdedor'} \${createTooltipHTML('(' + formatExpost(deltaBgE) + ')', 'Δ', formatExpost(conData.ben_gen_exp) + ' - ' + formatExpost(sinData.ben_gen_exp), 'right')}</td><td style="padding: 8px 12px; font-weight: \${deltaBgI > 0 ? 'bold' : 'normal'}; color:\${deltaBgI > 0 ? '#16a34a' : '#ef4444'}">\${deltaBgI > 0 ? 'Ganador' : 'Perdedor'} \${createTooltipHTML('(' + formatExpost(deltaBgI) + ')', 'Δ', formatExpost(conData.ben_gen_imp) + ' - ' + formatExpost(sinData.ben_gen_imp), 'right')}</td></tr>
                                    <tr><td style="padding: 8px 12px;">Δ Costo Demanda</td><td style="padding: 8px 12px; font-weight: \${deltaCdE < 0 ? 'bold' : 'normal'}; color:\${deltaCdE < 0 ? '#16a34a' : '#ef4444'}">\${deltaCdE < 0 ? 'Ganador' : 'Perdedor'} \${createTooltipHTML('(' + formatExpost(deltaCdE) + ')', 'Δ', formatExpost(conData.cos_dem_exp) + ' - ' + formatExpost(sinData.cos_dem_exp), 'right')}</td><td style="padding: 8px 12px; font-weight: \${deltaCdI < 0 ? 'bold' : 'normal'}; color:\${deltaCdI < 0 ? '#16a34a' : '#ef4444'}">\${deltaCdI < 0 ? 'Ganador' : 'Perdedor'} \${createTooltipHTML('(' + formatExpost(deltaCdI) + ')', 'Δ', formatExpost(conData.cos_dem_imp) + ' - ' + formatExpost(sinData.cos_dem_imp), 'right')}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            \`;
        };
`;

if (!logicPattern.test(content)) {
    console.error("Logic block not found!");
    process.exit(1);
}

content = content.replace(logicPattern, newLogicBlock);

fs.writeFileSync(targetFile, content);
console.log("Successfully replaced both the logic and the HTML.");
