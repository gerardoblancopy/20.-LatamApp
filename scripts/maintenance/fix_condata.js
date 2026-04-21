const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', '..', 'public', 'chart_helper.js');
let content = fs.readFileSync(targetFile, 'utf8');

const target1 = 'let target_curtrc = targetIsExp ? conData.curtrc_exp : conData.curtrc_imp;';
const target2 = 'let target_curtrg = targetIsExp ? conData.curtrg_exp : conData.curtrg_imp;';

if (content.includes(target1)) {
    content = content.replace(target1, 'let target_curtrc = 0;');
}
if (content.includes(target2)) {
    content = content.replace(target2, 'let target_curtrg = 0;');
}

fs.writeFileSync(targetFile, content);
console.log('Fixed conData issues!');
