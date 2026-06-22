"""
Sync math_outline.py → app.js MATH_TRACK

Parses math_outline.py (the source of truth) and generates the MATH_TRACK
JavaScript object in app.js. Uses write-then-replace approach to avoid
CJK quote corruption from Edit tool.
"""
import re

SYNC_MAIN_MAP = {d: d + 36 for d in range(1, 62)}

MODULE_STRUCTURE = [
    (1, "数学思维基础", "从确定性到随机性", list(range(1, 12))),
    (2, "统计推断", "从数据中提取结论", list(range(12, 24))),
    (3, "线性代数基础", "理解AI的数学语言", list(range(24, 40))),
    (4, "计算思维数学", "算法、图网络与量化工具", list(range(40, 53))),
    (5, "进阶数学", "信息论、优化与数值方法", list(range(53, 62))),
]


def parse_math_outline(filepath):
    """Parse math_outline.py and return structured day data."""
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    # Find all day headers with their positions
    header_pattern = re.compile(r'=== Math Day (\d+)：([^=]+) ===')
    header_matches = list(header_pattern.finditer(content))

    print(f'Found {len(header_matches)} day headers')

    days = {}
    for i, hm in enumerate(header_matches):
        day_num = int(hm.group(1))
        title = hm.group(2).strip()

        # Section start = beginning of this day's header
        section_start = hm.start()
        # Section end = start of next header, or end of content
        section_end = header_matches[i+1].start() if i+1 < len(header_matches) else len(content)

        section = content[section_start:section_end]

        # Trim trailing cruft: stop before next day's sync/marker line
        end_marker = re.search(r'\n\s*【同步：Main Day|\n\s*\{第 ', section)
        if end_marker:
            section = section[:end_marker.start()]

        # Extract clean prompt: dedent body lines relative to the body content
        lines = section.split('\n')
        # Find the indentation level of body content (skip header and trailing blank lines)
        body_indent = None
        for line in lines[1:]:
            if line.strip():
                indent = len(line) - len(line.lstrip())
                if body_indent is None or indent < body_indent:
                    body_indent = indent
        if body_indent and body_indent > 0:
            first_line = lines[0]
            rest_lines = []
            for line in lines[1:]:
                if line.strip():
                    rest_lines.append(line[body_indent:])
                else:
                    rest_lines.append('')  # blank lines become truly empty
            prompt = (first_line + '\n' + '\n'.join(rest_lines)).strip()
        else:
            prompt = section.strip()

        # Extract description from 【学习目的】
        desc_match = re.search(r'【学习目的】\n(.*?)(?=\n【|$)', prompt, re.DOTALL)
        if desc_match:
            desc_text = desc_match.group(1).strip()
            description = desc_text[:120].replace('\n', ' ').strip()
            if len(description) > 100:
                description = description[:100].rsplit('。', 1)[0] + '。'
        else:
            # Buffer/review days
            description = title

        # Extract tasks from 【练习任务】 or 【复习任务】
        task_match = re.search(r'【(?:练习|复习)任务】\n(.*?)(?=\n\n|\n===|\Z)', prompt, re.DOTALL)
        tasks = []
        if task_match:
            task_text = task_match.group(1).strip()
            # Match lines starting with - (possibly indented)
            task_lines = re.findall(r'^\s*-\s*(.*?)$', task_text, re.MULTILINE)
            tasks = [t.strip()[:120] for t in task_lines if t.strip()]

        days[day_num] = {
            'globalDay': day_num,
            'syncMain': SYNC_MAIN_MAP.get(day_num, day_num),
            'title': title,
            'description': description,
            'prompt': prompt,
            'tasks': tasks,
        }

    return days


def tidy_prompt(prompt):
    """Clean up and format prompt for JavaScript template literal."""
    lines = prompt.split('\n')
    # Remove excessive leading whitespace but preserve structure
    cleaned = []
    for line in lines:
        cleaned.append(line)
    return '\n'.join(cleaned)


def escape_js_string(s):
    """Escape a string for use inside a JS double-quoted string."""
    s = s.replace('\\', '\\\\')
    s = s.replace('"', '\\"')
    s = s.replace('\n', '\\n')
    return s


def escape_js_template(s):
    """Escape a string for use inside a JS template literal (backtick string)."""
    # Replace backtick, dollar+brace, backslash
    s = s.replace('\\', '\\\\')
    s = s.replace('`', '\\`')
    s = s.replace('${', '\\${')
    return s


def generate_js(days):
    """Generate the MATH_TRACK JavaScript code."""
    lines = ['const MATH_TRACK = {', '  modules: [']

    for mod_id, mod_name, mod_subtitle, day_range in MODULE_STRUCTURE:
        lines.append('    {')
        lines.append(f'      id: {mod_id},')
        lines.append(f'      name: "{mod_name}",')
        lines.append(f'      subtitle: "{mod_subtitle}",')
        lines.append('      daysData: [')

        mod_days = [days[d] for d in day_range if d in days]
        for i, day in enumerate(mod_days):
            lines.append('        {')
            lines.append(f'          globalDay: {day["globalDay"]}, syncMain: {day["syncMain"]},')
            lines.append(f'          title: "{escape_js_string(day["title"])}",')
            lines.append(f'          description: "{escape_js_string(day["description"])}",')

            # Prompt
            escaped_prompt = escape_js_template(day['prompt'])
            lines.append(f'          prompt: `{escaped_prompt}`,')

            # Tasks
            if day['tasks']:
                task_strs = [f'"{escape_js_string(t)}"' for t in day['tasks']]
                lines.append(f'          tasks: [{", ".join(task_strs)}]')
            else:
                lines.append('          tasks: []')

            comma = ',' if i < len(mod_days) - 1 else ''
            lines.append(f'        }}{comma}')

        lines.append('      ]')
        comma = ',' if mod_id < len(MODULE_STRUCTURE) else ''
        lines.append(f'    }}{comma}')

    lines.append('  ],')
    lines.append('  _map: null,')
    lines.append('  get totalDays() {')
    lines.append('    return this.modules.reduce(function(sum, m) { return sum + m.daysData.length; }, 0);')
    lines.append('  },')
    lines.append('  getDay(n) {')
    lines.append('    var self = this;')
    lines.append('    if (!self._map) {')
    lines.append('      self._map = {};')
    lines.append('      self.modules.forEach(function(m) {')
    lines.append('        m.daysData.forEach(function(d) {')
    lines.append('          self._map[d.globalDay] = { globalDay: d.globalDay, syncMain: d.syncMain, title: d.title, description: d.description, prompt: d.prompt, tasks: d.tasks, moduleName: m.name };')
    lines.append('        });')
    lines.append('      });')
    lines.append('    }')
    lines.append('    return self._map[n] || null;')
    lines.append('  }')
    lines.append('};')
    return '\n'.join(lines)


def replace_in_appjs(js_code, appjs_path):
    """Replace the MATH_TRACK section in app.js."""
    with open(appjs_path, encoding='utf-8') as f:
        content = f.read()

    # Find start of MATH_TRACK
    start = content.find('const MATH_TRACK = {')
    if start == -1:
        print("ERROR: MATH_TRACK not found in app.js")
        return False

    # Find the end of MATH_TRACK: the '};' just before the '// ====' separator
    separator = content.find('// ====', start)
    if separator == -1:
        print("ERROR: separator '// ====' not found after MATH_TRACK")
        return False

    # Search backwards from separator to find the '};' that closes MATH_TRACK
    end = content.rfind('};', start, separator)
    if end == -1:
        print("ERROR: closing '};' not found")
        return False
    end += 2  # include '};'

    new_content = content[:start] + js_code + '\n\n' + content[end:]

    with open(appjs_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return True


def main():
    days = parse_math_outline(r'd:\PY_practice_file\plan\math_outline.py')
    print(f'Parsed {len(days)} days from math_outline.py')

    # Verify all 61 days present
    missing = sorted(set(range(1, 62)) - set(days.keys()))
    if missing:
        print(f'WARNING: Missing days: {missing}')

    for day_num in sorted(days.keys()):
        d = days[day_num]
        task_count = len(d['tasks'])
        has_prompt = bool(d['prompt'])
        print(f'  Day {day_num}: {d["title"][:50]}... | tasks={task_count} | prompt={has_prompt}')

    # Generate JS
    js_code = generate_js(days)

    # Write to app.js
    appjs_path = r'd:\PY_practice_file\plan\app.js'
    if replace_in_appjs(js_code, appjs_path):
        print(f'\nSuccessfully updated MATH_TRACK in app.js')
    else:
        print('\nFailed to update app.js')


if __name__ == '__main__':
    main()
