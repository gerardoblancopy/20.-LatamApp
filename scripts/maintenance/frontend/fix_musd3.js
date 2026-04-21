const fs = require('fs');
let code = fs.readFileSync('public/chart_helper.js', 'utf8');

const targetStr = `asiaExpostMUSD = this.value === 'MUSD'; document.getElementById('asia_recalc').click();`;
const replaceStr = `document.getElementById('asia_recalc').click();`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('public/chart_helper.js', code);
    console.log("HTML replaced.");
} else {
    console.log("Not found.");
}
