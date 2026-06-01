"""
Comprehensive audit of math_outline.py against math_rewrite_principles.md
"""
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Expected classifications from principles (day_num -> classification)
EXPECTED_CLASS = {}
for d in [1,2,3,4,5,6,8,9,10,11]: EXPECTED_CLASS[d] = '核心日'
EXPECTED_CLASS[7] = '缓冲日'
EXPECTED_CLASS[12] = '核心日'; EXPECTED_CLASS[13] = '核心日'
EXPECTED_CLASS[14] = '精炼日'; EXPECTED_CLASS[15] = '核心日'
EXPECTED_CLASS[16] = '精炼日'; EXPECTED_CLASS[17] = '概念速览'
EXPECTED_CLASS[18] = '缓冲日'; EXPECTED_CLASS[19] = '核心日'
EXPECTED_CLASS[20] = '核心日'; EXPECTED_CLASS[21] = '精炼日'
EXPECTED_CLASS[22] = '精炼日'; EXPECTED_CLASS[23] = '核心日'
EXPECTED_CLASS[24] = '核心日'; EXPECTED_CLASS[25] = '核心日'
EXPECTED_CLASS[26] = '精炼日'; EXPECTED_CLASS[27] = '核心日'
EXPECTED_CLASS[28] = '核心日'; EXPECTED_CLASS[29] = '核心日'
EXPECTED_CLASS[30] = '精炼日'; EXPECTED_CLASS[31] = '缓冲日'
EXPECTED_CLASS[32] = '概念速览'; EXPECTED_CLASS[33] = '概念速览'
EXPECTED_CLASS[34] = '核心日'; EXPECTED_CLASS[35] = '核心日'
EXPECTED_CLASS[36] = '核心日'; EXPECTED_CLASS[37] = '核心日'
EXPECTED_CLASS[38] = '核心日'; EXPECTED_CLASS[39] = '缓冲日'
EXPECTED_CLASS[40] = '精炼日'; EXPECTED_CLASS[41] = '精炼日'
EXPECTED_CLASS[42] = '精炼日'; EXPECTED_CLASS[43] = '精炼日'
EXPECTED_CLASS[44] = '核心日'; EXPECTED_CLASS[45] = '精炼日'
EXPECTED_CLASS[46] = '精炼日'; EXPECTED_CLASS[47] = '核心日'
EXPECTED_CLASS[48] = '精炼日'; EXPECTED_CLASS[49] = '精炼日'
EXPECTED_CLASS[50] = '精炼日'; EXPECTED_CLASS[51] = '精炼日'
EXPECTED_CLASS[52] = '缓冲日'
for d in [53,54,55,56,57,58,59,60]: EXPECTED_CLASS[d] = '概念速览'
EXPECTED_CLASS[61] = '缓冲日'

EXPECTED_TASKS = {'核心日': 3, '精炼日': 2, '概念速览': 1, '缓冲日': 0}

SYNC_MAIN_MAP = {
    1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 10:10, 11:11,
    12:46, 13:47, 14:48, 15:49, 16:50, 17:51, 18:52, 19:53, 20:54,
    21:55, 22:56, 23:57,
    24:58, 25:58, 26:59, 27:59, 28:60, 29:61, 30:62, 31:63,
    32:65, 33:67, 34:69, 35:71, 36:73, 37:75, 38:77, 39:79,
    40:80, 41:81, 42:82, 43:83, 44:86, 45:87, 46:88, 47:90,
    48:92, 49:95, 50:97, 51:98, 52:99,
    53:118, 54:120, 55:122, 56:124, 57:126, 58:128, 59:131,
    60:133, 61:137,
}

REQUIRED_FIELDS = [
    '【每日学习时长】', '【与主计划的关联】', '【学习目的】',
    '【学习标准】', '【学习难度】', '【所需工具】', '【核心概念】', '【练习任务】',
]


def audit():
    with open(r'd:\PY_practice_file\plan\math_outline.py', encoding='utf-8') as f:
        content = f.read()

    header_pattern = re.compile(r'=== Math Day (\d+)：([^=]+) ===')
    matches = list(header_pattern.finditer(content))

    errors = []
    warnings = []
    day_summary = []

    for i, hm in enumerate(matches):
        day_num = int(hm.group(1))
        title = hm.group(2).strip()
        day_header_pos = hm.start()

        # Section: from this day header to next day header (or EOF)
        section_start = day_header_pos
        section_end = matches[i+1].start() if i+1 < len(matches) else len(content)
        section = content[section_start:section_end]

        # Remove leading indentation for the prompt
        lines = section.split('\n')
        min_indent = None
        for line in lines:
            if line.strip():
                indent = len(line) - len(line.lstrip())
                if min_indent is None or indent < min_indent:
                    min_indent = indent
        if min_indent and min_indent > 0:
            prompt = '\n'.join(line[min_indent:] for line in lines).strip()
        else:
            prompt = section.strip()

        # --- Classification: search the line with {第 X 天} BEFORE the day header ---
        before_header = content[:day_header_pos]
        day_marker = f'{{第 {day_num} 天}}'
        day_marker_pos = before_header.rfind(day_marker)
        found_class = None
        if day_marker_pos >= 0:
            marker_line_end = content.find('\n', day_marker_pos)
            marker_line = content[day_marker_pos:marker_line_end]
            for cls in ['核心日', '精炼日', '概念速览']:
                if f'【{cls}】' in marker_line:
                    found_class = cls
                    break
        if not found_class and ('缓冲' in title or '复习' in title):
            found_class = '缓冲日'

        # --- syncMain: search the line with 【同步：Main Day X】 that is before this day header ---
        # Find all sync annotations
        sync_pattern = re.compile(r'【同步：Main Day (\d+)】')
        # Find the sync closest to (but before) this day header
        sync_pos = -1
        sync_val = None
        for sm in sync_pattern.finditer(content):
            if sm.start() < day_header_pos:
                sync_pos = sm.start()
                sync_val = int(sm.group(1))
        if sync_val is None:
            errors.append(f'Day {day_num}: no sync annotation found')

        # --- Task count ---
        task_section_match = re.search(r'【(?:练习|复习)任务】\n(.*?)(?=\n\n|\n===|\Z)', prompt, re.DOTALL)
        task_count = 0
        if task_section_match:
            task_text = task_section_match.group(1).strip()
            task_count = len(re.findall(r'^\s*-\s*(.*?)$', task_text, re.MULTILINE))

        # --- Run checks ---
        expected_class = EXPECTED_CLASS.get(day_num)
        if expected_class and found_class != expected_class:
            errors.append(f'Day {day_num}: class mismatch - [{found_class}] vs expected [{expected_class}]')
        elif not found_class:
            warnings.append(f'Day {day_num}: no classification found')
        elif not expected_class:
            warnings.append(f'Day {day_num}: no expected class in audit map')

        if found_class:
            expected_tc = EXPECTED_TASKS.get(found_class, 0)
            if task_count != expected_tc:
                errors.append(f'Day {day_num}: task count {task_count}, expected {expected_tc} ({found_class})')

        # 7-field completeness (learning days only)
        if found_class != '缓冲日':
            missing = [f for f in REQUIRED_FIELDS if f not in prompt]
            if missing:
                errors.append(f'Day {day_num}: missing fields: {missing}')

        # Time consistency
        if found_class != '缓冲日' and '约25分钟' not in prompt:
            errors.append(f'Day {day_num}: time not 25 minutes')
        if found_class == '缓冲日' and '约25分钟' in prompt:
            warnings.append(f'Day {day_num}: buffer day has 25-min time')

        # syncMain check
        expected_sync = SYNC_MAIN_MAP.get(day_num)
        if expected_sync and sync_val and sync_val != expected_sync:
            errors.append(f'Day {day_num}: syncMain {sync_val}, expected {expected_sync}')

        # Record for summary
        day_summary.append((day_num, found_class, task_count, sync_val))

    # --- Print results ---
    print('=' * 60)
    print(f'AUDIT RESULTS: {len(errors)} errors, {len(warnings)} warnings')
    print('=' * 60)

    for e in errors:
        print(f'  ✗ {e}')
    for w in warnings:
        print(f'  ⚠ {w}')

    if not errors and not warnings:
        print('✓ All checks passed!')

    # Day-by-day summary
    print('\n--- Day Summary ---')
    print(f'{"Day":>4} {"Class":<8} {"Tasks":>5} {"syncMain":>8}  Title')
    print('-' * 70)
    for d_num, cls, tc, sm in day_summary:
        cls_str = cls or '?'
        tc_str = str(tc)
        sm_str = str(sm) if sm else '?'
        # Get title
        title_str = ''
        for hm in matches:
            if int(hm.group(1)) == d_num:
                title_str = hm.group(2).strip()[:35]
                break
        print(f'{d_num:>4} {cls_str:<8} {tc_str:>5} {sm_str:>8}  {title_str}')

    # Classification summary
    print('\n--- Classification Counts ---')
    class_counts = {}
    for _, cls, _, _ in day_summary:
        class_counts[cls] = class_counts.get(cls, 0) + 1
    for cls, cnt in sorted(class_counts.items(), key=lambda x: str(x[0])):
        print(f'  {cls}: {cnt}')


if __name__ == '__main__':
    audit()
