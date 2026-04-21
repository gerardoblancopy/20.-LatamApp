import sys

with open('public/chart_helper.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Deltas row heights
content = content.replace(
    '''<tr><td style="padding: 8px 12px;">Δ Costo Operación</td>''',
    '''<tr style="height: 54px;"><td style="padding: 8px 12px;">Δ Costo Operación</td>'''
)
content = content.replace(
    '''<tr><td style="padding: 8px 12px;">Δ Ben Generador</td>''',
    '''<tr style="height: 54px;"><td style="padding: 8px 12px;">Δ Ben Generador</td>'''
)
content = content.replace(
    '''<tr><td style="padding: 8px 12px;">Δ Costo Demanda</td>''',
    '''<tr style="height: 54px;"><td style="padding: 8px 12px;">Δ Costo Demanda</td>'''
)

# Wait! The earlier CSS styling for the 3rd panel header was not applied properly either!
# It says: <div class="res-card-header" style="background: #f5f3ff; color: #4c1d95; font-size: 0.9em;">
# Let's fix it to match dark mode:
content = content.replace(
    '''<div class="res-card-header" style="background: #f5f3ff; color: #4c1d95; font-size: 0.9em;">${createTooltipHTML('3. Ganadores y perdedores (Δ)',''',
    '''<div class="res-card-header" style="background: #4c1d95; color: white; font-size: 0.9em;">${createTooltipHTML('3. Ganadores y perdedores (Δ)','''
)

with open('public/chart_helper.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Deltas fixed.")
