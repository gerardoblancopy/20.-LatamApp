with open("public/chart_helper.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    line_num = i + 1
    if 3026 <= line_num <= 3102:
        continue
    new_lines.append(line)

with open("public/chart_helper.js", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Duplicate block removed.")
