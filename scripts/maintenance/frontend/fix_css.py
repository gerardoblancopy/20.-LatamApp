import sys

with open('public/chart_helper.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the outer wrapper from white to dark
content = content.replace(
    'margin-bottom: 24px; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);',
    'margin-bottom: 24px; background: var(--bg-surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);'
)

# Replace the text colors for the wrapper header
content = content.replace(
    '''<h3 style="margin-bottom: 0; font-size: 1.15rem; font-weight: 700; color: #1e293b;">Análisis Adicional: 3 Modelos Ex-Post (Semestre ${sem})</h3>''',
    '''<h3 style="margin-bottom: 0; font-size: 1.15rem; font-weight: 700; color: white;">Análisis Adicional: 3 Modelos Ex-Post (Semestre ${sem})</h3>'''
)

# Replace the inner res-card styles to match OIRSE dark cards
# Case SIN
content = content.replace(
    '''<div class="res-card-header" style="background: #f3f4f6; font-size: 0.9em;">${createTooltipHTML('1. Caso Base (SIN)',''',
    '''<div class="res-card-header" style="background: #374151; color: white; font-size: 0.9em;">${createTooltipHTML('1. Caso Base (SIN)','''
).replace(
    '''border-top: 4px solid #9ca3af; box-shadow: none; border: 1px solid #cbd5e1;''',
    '''border-top: 4px solid #9ca3af; box-shadow: none; border: 1px solid var(--border); background: var(--bg-elevated); color: white;'''
)

# Case CON
content = content.replace(
    '''<div class="res-card-header" style="background: #eff6ff; color: #1e3a8a; font-size: 0.9em;">${createTooltipHTML('2. Caso Interconectado (CON)',''',
    '''<div class="res-card-header" style="background: #1e3a8a; color: white; font-size: 0.9em;">${createTooltipHTML('2. Caso Interconectado (CON)','''
).replace(
    '''border-top: 4px solid #3b82f6; box-shadow: none; border: 1px solid #cbd5e1;''',
    '''border-top: 4px solid #3b82f6; box-shadow: none; border: 1px solid var(--border); background: var(--bg-elevated); color: white;'''
)

# Case Deltas
content = content.replace(
    '''<div class="res-card-header" style="background: #f5f3ff; color: #4c1d95; font-size: 0.9em;">${createTooltipHTML('3. Ganadores y perdedores (?)',''',
    '''<div class="res-card-header" style="background: #4c1d95; color: white; font-size: 0.9em;">${createTooltipHTML('3. Ganadores y perdedores (?)','''
).replace(
    '''border-top: 4px solid #8b5cf6; box-shadow: none; border: 1px solid #cbd5e1;''',
    '''border-top: 4px solid #8b5cf6; box-shadow: none; border: 1px solid var(--border); background: var(--bg-elevated); color: white;'''
)

# Fix inner th/td borders inside these tables just in case, but background: var(--bg-elevated) should do the trick.

with open('public/chart_helper.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("CSS changes applied.")
