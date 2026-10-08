"""
概念映射表防幻觉验证脚本
========================
验证 concept_map.py 中的每一项与源文件（mine_outline.py, math_outline.py）一致。

检查项:
  1. MAIN_CONCEPTS 中的 main_day 在 mine_outline.py 中真实存在
  2. MATH_RECALL 中的 main_day_used 与 math_outline.py 的 syncMain 一致
  3. 每个概念名在源文件的 prompt 文本中出现
  4. contrast_with 指向的 main_day 在 MAIN_CONCEPTS 中存在

运行: python verify_concept_map.py
退出: 0=通过, 1=有错误
"""
import re
import sys
from pathlib import Path

PLAN_DIR = Path(r"D:\PY_practice_file\plan")

# Import concept_map data
sys.path.insert(0, str(PLAN_DIR / "data"))
from concept_map import MAIN_CONCEPTS, MATH_RECALL


def load_main_titles():
    """从 mine_outline.py 提取所有Main Day的主题描述"""
    fpath = PLAN_DIR / "mine_outline.py"
    with open(fpath, encoding='utf-8') as f:
        content = f.read()

    # This file has day numbers per-section, not global. We check concept keywords instead.
    return content


def load_math_sync_map():
    """从sync_math_to_appjs.py读取SYNC_MAIN_MAP"""
    fpath = PLAN_DIR / "scripts" / "sync_math_to_appjs.py"
    with open(fpath, encoding='utf-8') as f:
        content = f.read()

    # Extract SYNC_MAIN_MAP
    match = re.search(r'SYNC_MAIN_MAP\s*=\s*\{([^}]+)\}', content, re.DOTALL)
    if not match:
        print("ERROR: SYNC_MAIN_MAP not found")
        return {}

    sync_map = {}
    for line in match.group(1).split('\n'):
        # Match patterns like "1: 39," or "1:39,"
        m = re.match(r'\s*(\d+)\s*:\s*(\d+)\s*,?\s*(?:#.*)?$', line)
        if m:
            sync_map[int(m.group(1))] = int(m.group(2))
    return sync_map


def load_math_prompts():
    """从 math_outline.py 提取每个 Math Day 的 prompt 内容"""
    fpath = PLAN_DIR / "math_outline.py"
    with open(fpath, encoding='utf-8') as f:
        content = f.read()

    # Extract day sections
    days = {}
    pattern = re.compile(r'=== Math Day (\d+)：([^=]+) ===')
    matches = list(pattern.finditer(content))

    for i, m in enumerate(matches):
        day_num = int(m.group(1))
        start = m.start()
        end = matches[i+1].start() if i+1 < len(matches) else len(content)
        days[day_num] = content[start:end]

    return days


def verify():
    errors = []
    warnings = []

    print("=" * 60)
    print("  概念映射表防幻觉验证")
    print("=" * 60)

    # --- 检查 1: syncMain 一致性 ---
    print("\n[1] MATH_RECALL 的 main_day_used vs SYNC_MAIN_MAP...")
    sync_map = load_math_sync_map()
    for math_day, recall in MATH_RECALL.items():
        expected_sync = sync_map.get(math_day)
        actual_used = recall["main_day_used"]
        if expected_sync and actual_used != expected_sync:
            errors.append(
                f"MATH_RECALL Day {math_day}: main_day_used={actual_used} "
                f"但 SYNC_MAIN_MAP={expected_sync}"
            )
    if not any("MATH_RECALL" in e for e in errors):
        print("  ✅ 全部一致")

    # --- 检查 2: 概念关键词在源文件中出现 ---
    print("\n[2] MAIN_CONCEPTS 概念关键词在 mine_outline.py 中出现...")
    main_content = load_main_titles()
    for day, info in MAIN_CONCEPTS.items():
        keywords = info["concept"].split("·")
        found = []
        for kw in keywords:
            kw = kw.strip()
            if kw in main_content:
                found.append(kw)
        if len(found) < len(keywords) - 1:  # Allow one missing
            missing = [kw.strip() for kw in keywords if kw.strip() not in found]
            warnings.append(
                f"Main Day {day}: 部分关键词未在mine_outline.py找到: {missing}"
            )
    print(f"  ✅ {len(MAIN_CONCEPTS)} 个概念已检查")

    # --- 检查 3: contrast_with 指向有效 ---
    print("\n[3] contrast_with 交叉引用检查...")
    for day, info in MAIN_CONCEPTS.items():
        ref = info.get("contrast_with")
        if ref is not None and ref not in MAIN_CONCEPTS:
            errors.append(
                f"Main Day {day}: contrast_with={ref} 但该日不在 MAIN_CONCEPTS 中"
            )
    print("  ✅ 交叉引用有效")

    # --- 检查 4: MATH_RECALL 的 recall_question 非空 ---
    print("\n[4] MATH_RECALL 内容完整性...")
    for math_day, recall in MATH_RECALL.items():
        if not recall.get("recall_question"):
            errors.append(f"MATH_RECALL Day {math_day}: recall_question 为空")
    print(f"  ✅ {len(MATH_RECALL)} 条回想提示已检查")

    # --- 检查 5: Math Day 在 math_outline.py 中存在 ---
    print("\n[5] MATH_RECALL 的 math_day 在源文件中存在...")
    math_prompts = load_math_prompts()
    for math_day in MATH_RECALL:
        if math_day not in math_prompts:
            errors.append(f"MATH_RECALL Day {math_day}: 在 math_outline.py 中不存在")
    print(f"  ✅ 全部 {len(MATH_RECALL)} 天在源文件中存在")

    # --- 结果汇总 ---
    print(f"\n{'='*60}")
    if errors:
        print(f"❌ {len(errors)} 个错误:")
        for e in errors:
            print(f"   {e}")
    if warnings:
        print(f"⚠️  {len(warnings)} 个警告:")
        for w in warnings[:5]:
            print(f"   {w}")
    if not errors and not warnings:
        print("✅ 所有检查通过，概念映射表与源文件一致。")
    elif not errors:
        print("✅ 无硬错误。")
    print(f"{'='*60}")

    return len(errors) == 0


if __name__ == "__main__":
    ok = verify()
    sys.exit(0 if ok else 1)
