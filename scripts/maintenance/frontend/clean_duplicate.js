const fs = require('fs');

const path = "public/chart_helper.js";
let lines = fs.readFileSync(path, 'utf-8').split('\n');

// Javascript arrays are 0-indexed.
// Lines 3026 to 3102 mean indices 3025 to 3101 inclusive.
let newLines = [];
for (let i = 0; i < lines.length; i++) {
    let lineNum = i + 1;
    if (lineNum >= 3026 && lineNum <= 3102) {
        continue;
    }
    newLines.push(lines[i]);
}

fs.writeFileSync(path, newLines.join('\n'), 'utf-8');
console.log("Duplicate block removed.");
