import sys

with open('public/chart_helper.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''        const generateExPostHTML = (sem) => {
            const conData = calculateExPostSIEPAC_Semestral(true, sem);'''

replacement = '''        const generateExPostHTML = (sem) => {
            const formatCur = (val) => val != null && !isNaN(val) ? (siepacExpostMUSD ? (val / 1000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : '0.00';
            const conData = calculateExPostSIEPAC_Semestral(true, sem);'''

if target in content:
    content = content.replace(target, replacement)
    with open('public/chart_helper.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("MUSD logic applied.")
else:
    print("Target not found. Looking at exact lines near 3900:")
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'const generateExPostHTML' in line:
            print(f"Line {i}:", repr(line))
            for j in range(1, 3):
                print(f"Line {i+j}:", repr(lines[i+j]))

