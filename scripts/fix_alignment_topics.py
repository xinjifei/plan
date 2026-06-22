"""Fix alignment topics in math_outline.py to match Main Day titles."""
import re

with open('../app.js', encoding='utf-8') as f:
    app_content = f.read()
main_start = app_content.find('const MAIN_PLAN = {')
main_topics = {}
for m in re.finditer(r'globalDay: (\d+),\s+title: \"([^\"]+)\"', app_content[main_start:main_start+500000]):
    gd = int(m.group(1))
    if gd not in main_topics:
        main_topics[gd] = m.group(2)

with open('../math_outline.py', encoding='utf-8') as f:
    lines = f.readlines()

changes = 0
for i, line in enumerate(lines):
    m = re.match(r'(\s*今天 Main Day )(\d+)( 正在学：)(.+)', line)
    if m:
        indent = m.group(1)
        target = int(m.group(2))
        sep = m.group(3)
        old_topic = m.group(4).rstrip('\n').rstrip('。').strip()

        correct_topic = main_topics.get(target)
        if correct_topic is None:
            continue

        if old_topic == correct_topic:
            continue

        new_line = '%s%d%s%s。\n' % (indent, target, sep, correct_topic)
        lines[i] = new_line
        changes += 1

with open('../math_outline.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Updated %d topic lines' % changes)
