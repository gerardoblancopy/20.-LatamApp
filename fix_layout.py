import sys

with open('public/chart_helper.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Tooltip clipping: add overflow: visible directly to the res-card-body of the 3 cards
content = content.replace(
    '''<div class="res-card-body" style="padding: 0;">''',
    '''<div class="res-card-body" style="padding: 0; overflow: visible !important;">'''
)

# Fix row heights: Set a fixed height on all rows in the Ex-Post tables
content = content.replace(
    '''<tr><td style="padding: 8px 12px;">Costo Operaci''',
    '''<tr style="height: 54px;"><td style="padding: 8px 12px;">Costo Operaci'''
)
content = content.replace(
    '''<tr><td style="padding: 8px 12px;">Beneficio Generador</td>''',
    '''<tr style="height: 54px;"><td style="padding: 8px 12px;">Beneficio Generador</td>'''
)
content = content.replace(
    '''<tr><td style="padding: 8px 12px;">Costo Demanda</td>''',
    '''<tr style="height: 54px;"><td style="padding: 8px 12px;">Costo Demanda</td>'''
)
content = content.replace(
    '''<tr><td style="padding: 8px 12px;">Op + Peaje</td>''',
    '''<tr style="height: 54px;"><td style="padding: 8px 12px;">Op + Peaje</td>'''
)
content = content.replace(
    '''<tr><td style="padding: 8px 12px;">Ben Gen + Renta - Peaje</td>''',
    '''<tr style="height: 54px;"><td style="padding: 8px 12px;">Ben Gen + Renta - Peaje</td>'''
)
content = content.replace(
    '''<tr><td style="padding: 8px 12px;">Dem + Peaje - Renta</td>''',
    '''<tr style="height: 54px;"><td style="padding: 8px 12px;">Dem + Peaje - Renta</td>'''
)
content = content.replace(
    '''<tr><td style="padding: 8px 12px;">? Costo Operacin</td>''',
    '''<tr style="height: 54px;"><td style="padding: 8px 12px;">? Costo Operacin</td>'''
)
content = content.replace(
    '''<tr><td style="padding: 8px 12px;">? Beneficio Gen</td>''',
    '''<tr style="height: 54px;"><td style="padding: 8px 12px;">? Beneficio Gen</td>'''
)
content = content.replace(
    '''<tr><td style="padding: 8px 12px;">? Costo Demanda</td>''',
    '''<tr style="height: 54px;"><td style="padding: 8px 12px;">? Costo Demanda</td>'''
)

# We also want to increase tooltip z-index globally just in case.
content = content.replace(
    '''z-index: 100;''',
    '''z-index: 99999;'''
)

# And let's make tooltips wider as they sometimes wrap aggressively
content = content.replace(
    '''width: 250px; padding: 12px;''',
    '''width: 320px; padding: 14px;'''
)

with open('public/chart_helper.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Layout fixes applied.")

