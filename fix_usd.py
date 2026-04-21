import sys

with open('public/chart_helper.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the let declaration with a window check
content = content.replace("let siepacExpostMUSD = true;", "if (typeof window.siepacExpostMUSD === 'undefined') window.siepacExpostMUSD = true;")

# Everywhere else, replace siepacExpostMUSD with window.siepacExpostMUSD safely.
# Wait, some places might already have it or we can just replace 'siepacExpostMUSD' with 'window.siepacExpostMUSD'
# However, we must not replace 'window.siepacExpostMUSD' to 'window.window.siepacExpostMUSD'.
content = content.replace('window.siepacExpostMUSD', 'siepacExpostMUSD')
content = content.replace('siepacExpostMUSD', 'window.siepacExpostMUSD')

with open('public/chart_helper.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("USD toggle bug fixed.")
