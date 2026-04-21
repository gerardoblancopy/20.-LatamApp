const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', '..', 'public', 'chart_helper.js');
let content = fs.readFileSync(targetFile, 'utf8');

// Replace the buggy calculateExPostSIEPAC_Semestral and getCountryStatsSlice
// We'll just define the logic regex and replace the whole thing starting from `function getCountryStatsSlice` to the end of `calculateExPostSIEPAC_Semestral`
// And we also want to remove `function getCountryStatsSlice` completely.

const pattern = /function getCountryStatsSlice\(.*?const calculateExPostSIEPAC_Semestral = \(isCon, sem\) => \{[\s\S]*?(?=const generateExPostHTML)/s;

const newLogicBlock = `
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
            
            let fraction_year = (sFlows.length * s_division_horas) / 8760;
            if(isNaN(fraction_year) || fraction_year <= 0) fraction_year = 0.5;

            return { s_expC, s_impC, s_MR_allocated, s_MI_allocated, sum_abs_f_MWh_s, s_renta, fraction_year };
        };

        const calculateExPostSIEPAC_Semestral = (isCon, sem) => {
            const context = calcSemestralParams(sem);
            // Re-use the correct getCountryStats (which aggregates all generators)
            let statsE = getCountryStats(context.s_expC, isCon ? globalData.genS1 : globalData.genS0, isCon ? globalData.demS1 : globalData.demS0);
            let statsI = getCountryStats(context.s_impC, isCon ? globalData.genS1 : globalData.genS0, isCon ? globalData.demS1 : globalData.demS0);

            let f_year = context.fraction_year;

            // Apply fraction_year to annual metrics to obtain semestral metrics
            let Rc_sem_E = (statsE.demandMW || 1) * f_year; 
            let Ig_sem_E = (statsE.prod || 1) * f_year; 
            let Rc_sem_I = (statsI.demandMW || 1) * f_year; 
            let Ig_sem_I = (statsI.prod || 1) * f_year; 

            let curtrc_exp = Rc_sem_E > 0 ? context.s_MR_allocated / Rc_sem_E : 0;
            let curtrg_exp = Ig_sem_E > 0 ? context.s_MI_allocated / Ig_sem_E : 0;
            let curtrc_imp = Rc_sem_I > 0 ? context.s_MR_allocated / Rc_sem_I : 0;
            let curtrg_imp = Ig_sem_I > 0 ? context.s_MI_allocated / Ig_sem_I : 0;

            let op_cost_h_e = statsE.opCost * f_year;
            let op_cost_h_i = statsI.opCost * f_year;
            let profit_h_e = statsE.genProfit * f_year;
            let profit_h_i = statsI.genProfit * f_year;
            let demand_cost_h_e = statsE.demandCost * f_year;
            let demand_cost_h_i = statsI.demandCost * f_year;

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

        `;

if (!pattern.test(content)) {
    console.error("Pattern not found");
    process.exit(1);
}

content = content.replace(pattern, newLogicBlock);

fs.writeFileSync(targetFile, content);
console.log("Successfully fixed semestral slicing.");
