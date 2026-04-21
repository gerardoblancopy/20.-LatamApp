const fs = require('fs');
let code = fs.readFileSync('public/chart_helper.js', 'utf8');

const target = `            asiaProjectToYear = document.getElementById('asia_ptoyear').checked;
            renderAsia();`;

const repl = `            asiaProjectToYear = document.getElementById('asia_ptoyear').checked;
            if (document.getElementById('asia_expost_unit')) {
                asiaExpostMUSD = document.getElementById('asia_expost_unit').value === 'MUSD';
            }
            renderAsia();`;

if (code.includes(target)) {
    code = code.replace(target, repl);
    fs.writeFileSync('public/chart_helper.js', code);
    console.log("Fixed Expost MUSD");
} else {
    // maybe \r\n ?
    const target2 = `            asiaProjectToYear = document.getElementById('asia_ptoyear').checked;\r\n            renderAsia();`;
    const repl2 = `            asiaProjectToYear = document.getElementById('asia_ptoyear').checked;\r\n            if (document.getElementById('asia_expost_unit')) {\r\n                asiaExpostMUSD = document.getElementById('asia_expost_unit').value === 'MUSD';\r\n            }\r\n            renderAsia();`;
    
    if (code.includes(target2)) {
        code = code.replace(target2, repl2);
        fs.writeFileSync('public/chart_helper.js', code);
        console.log("Fixed Expost MUSD with CRLF");
    } else {
        console.log("Target not found!");
    }
}
