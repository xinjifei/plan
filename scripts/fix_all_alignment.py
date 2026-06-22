"""
Simplified: Fix alignment issues across all files.
"""
import re
import sys
from pathlib import Path

PLAN_DIR = Path(r"D:\PY_practice_file\plan")

CORRECTED_SYNC = {
    1:39,2:40,3:41,4:42,5:43,6:44,7:45,8:46,9:46,10:46,11:47,
    12:48,13:48,14:48,15:48,16:48,17:48,18:48,19:48,20:48,21:84,22:86,23:93,
    24:67,25:67,26:68,27:69,28:79,29:79,30:80,31:81,32:82,33:82,34:83,35:84,36:85,37:86,38:87,39:88,
    40:86,41:86,42:86,43:91,44:93,45:95,46:95,47:96,48:96,49:97,50:97,51:98,52:99,
    53:156,54:158,55:160,56:162,57:164,58:166,59:169,60:171,61:175,
}

MAIN_DAY_TOPICS = {
    39:"pytest参数化 + Fixture——批量验证思维",
    40:"缓冲/复习日——回顾本周工程工具",
    41:"代码质量工具——ruff 格式化 + AI 代码审查",
    42:"工程基座综合验收 + AI协作工作流建立",
    43:"缓冲/复习日——整理工程工具知识",
    44:"缓冲/复习日——回顾阶段知识",
    45:"缓冲/复习日——准备进入金融数学阶段",
    46:"随机变量、期望值、方差——全用股票收益率数据可视化理解",
    47:"相关性、协方差矩阵——用10只股票计算并画热力图",
    48:"假设检验直觉——用 bootstrap 模拟理解策略的 Sharpe 是否显著",
    67:"Embedding是什么？——国王-男人+女人≈女王",
    68:"Context Window、Temperature、Top-P——这些参数如何影响输出",
    69:"System Prompt vs User Prompt——学会调教模型行为",
    79:"ChromaDB 基础——什么是向量数据库？",
    80:"文档分块（Chunking）策略——研报太长怎么切？",
    81:"构建一个研报知识库——把研报变成可查询的向量",
    82:"RAG 问答系统——最近三个月宁德时代的研报都说了什么？",
    83:"缓冲/复习日",
    84:"前视偏差、幸存者偏差、过拟合——回测的三大死穴",
    86:"手写一个最简单的向量化回测——金叉买、死叉卖",
    91:"因子研究——什么是Alpha因子？常见因子类型",
    93:"因子IC分析——这个因子真的能预测收益吗？",
    95:"Sharpe Ratio、Max Drawdown、Calmar Ratio——只看收益率是不够的",
    96:"Walk-Forward 分析——避免过拟合的回测验证方法",
    97:"蒙特卡洛模拟——随机打乱交易顺序检验显著性",
    98:"策略衰减检测——什么信号表明策略过期了？",
    99:"综合验收——输出完整的策略研究报告",
    156:"进阶数学——信息论入门：KL散度与模型比较的直觉",
    158:"进阶数学——贝叶斯定理的量化应用场景",
    160:"进阶数学——马尔可夫链与状态转移思维",
    162:"进阶数学——数值方法：梯度之外的优化思路",
    164:"进阶数学——凸优化的基本直觉",
    166:"进阶数学——决策树的数学原理",
    169:"进阶数学——正则化：防止过拟合的数学手段",
    171:"进阶数学——维度诅咒与几何直觉",
    175:"终局综合验收——完整的量化+AI系统",
}

MODULE_STRUCTURE_CODE = """MODULE_STRUCTURE = [
    (1, "数学思维基础", "从确定性到随机性", list(range(1, 12))),
    (2, "统计推断", "从数据中提取结论", list(range(12, 24))),
    (3, "线性代数基础", "理解AI的数学语言", list(range(24, 40))),
    (4, "计算思维数学", "算法、图网络与量化工具", list(range(40, 53))),
    (5, "进阶数学", "信息论、优化与数值方法", list(range(53, 62))),
]"""


def build_sync_main_map_code():
    lines = ["SYNC_MAIN_MAP = {"]
    lines.append("    # 模块一：数学思维基础 —— Main Day 39-47")
    for d in range(1,12): lines.append(f"    {d}: {CORRECTED_SYNC[d]},")
    lines.append("    # 模块二：统计推断 —— 假设检验前置(Day 48) + 回归/过拟合(Day 84-93)")
    for d in range(12,24): lines.append(f"    {d}: {CORRECTED_SYNC[d]},")
    lines.append("    # 模块三：线性代数基础 —— Main Day 67-88")
    for d in range(24,40): lines.append(f"    {d}: {CORRECTED_SYNC[d]},")
    lines.append("    # 模块四：计算思维数学 —— Main Day 86-99")
    for d in range(40,53): lines.append(f"    {d}: {CORRECTED_SYNC[d]},")
    lines.append("    # 模块五：进阶数学 —— Main Day 156-175")
    for d in range(53,62): lines.append(f"    {d}: {CORRECTED_SYNC[d]},")
    lines.append("}")
    return "\n".join(lines)


def fix_sync_script():
    filepath = PLAN_DIR / "scripts" / "sync_math_to_appjs.py"
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    # Replace SYNC_MAIN_MAP
    map_start = content.find("SYNC_MAIN_MAP = {")
    map_end = content.find("\n]", content.find("MODULE_STRUCTURE = ["))  # rough
    # Find precise end: the closing } before MODULE_STRUCTURE
    mod_start = content.find("\nMODULE_STRUCTURE = [")
    map_block = content[map_start:mod_start]
    # Find the last } in the block
    last_brace = map_block.rfind("}")
    map_end = map_start + last_brace + 1

    new_map = build_sync_main_map_code()
    content = content[:map_start] + new_map + content[map_end:]

    # Replace MODULE_STRUCTURE
    mod_start2 = content.find("MODULE_STRUCTURE = [")
    mod_end2 = content.find("\n]", mod_start2) + 2

    content = content[:mod_start2] + MODULE_STRUCTURE_CODE + content[mod_end2:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("OK: sync_math_to_appjs.py updated")


def fix_math_outline():
    filepath = PLAN_DIR / "math_outline.py"
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    changes = 0

    # 1. Fix module header ranges
    header_fixes = [
        ("Day 39-49（工程基座 + pytest → ruff → 金融与数学基础）",
         "Day 39-47（工程基座 → 金融与数学基础）"),
        ("Day 84-95（量化回测与策略开发阶段）",
         "Day 48-93（假设检验前置 Day 48 + 回归/过拟合 Day 84-93）"),
        ("Day 96-117（AI核心技术阶段）",
         "Day 67-88（Embedding/向量DB → 矩阵 → AI数学直觉）"),
        ("Day 118-137（量化回测与策略开发阶段）",
         "Day 86-99（量化回测：收益率 → 因子评估 → 策略检验）"),
    ]
    for old, new in header_fixes:
        if old in content:
            content = content.replace(old, new)
            changes += 1
            print(f"  Header fix: {old[:40]}... -> {new[:40]}...")
        else:
            print(f"  WARNING: header not found: {old[:40]}...")

    # 2. Fix 【同步：Main Day X】 markers
    # Find each {第 N 天} and look backwards for its sync marker
    day_positions = []
    for m in re.finditer(r'\{第 (\d+) 天\}', content):
        day_positions.append((int(m.group(1)), m.start()))

    for day_num, pos in day_positions:
        new_sync = CORRECTED_SYNC.get(day_num)
        if new_sync is None:
            continue
        # Search backwards from this day marker for the nearest sync marker
        search_start = max(0, pos - 600)
        search_area = content[search_start:pos]
        sync_matches = list(re.finditer(r'【同步：Main Day (\d+)】', search_area))
        if sync_matches:
            last_sync = sync_matches[-1]
            old_sync = int(last_sync.group(1))
            if old_sync != new_sync:
                actual_pos = search_start + last_sync.start()
                old_text = "【同步：Main Day %d】" % old_sync
                new_text = "【同步：Main Day %d】" % new_sync
                content = content[:actual_pos] + new_text + content[actual_pos + len(old_text):]
                changes += 1

    print("  Sync markers: %d updated" % changes)

    # 3. Fix 【与主计划的关联】 alignment text
    # Find each day section and update the Main Day reference
    header_pattern = re.compile(r'=== Math Day (\d+)：[^=]+ ===')
    header_matches = list(header_pattern.finditer(content))

    align_changes = 0
    for i, hm in enumerate(header_matches):
        day_num = int(hm.group(1))
        new_sync = CORRECTED_SYNC.get(day_num)
        if new_sync is None:
            continue

        section_start = hm.start()
        section_end = header_matches[i+1].start() if i+1 < len(header_matches) else len(content)
        section = content[section_start:section_end]

        # Find 【与主计划的关联】 section
        align_match = re.search(r'【与主计划的关联】\s*\n\s*今天 Main Day (\d+) 正在学：([^\n]*)', section)
        if not align_match:
            continue

        old_main_day = int(align_match.group(1))
        if old_main_day == new_sync:
            continue

        topic = MAIN_DAY_TOPICS.get(new_sync)
        if topic is None:
            continue

        old_text = align_match.group(0)
        new_line = "【与主计划的关联】\n            今天 Main Day %d 正在学：%s。" % (new_sync, topic)

        actual_pos = section_start + align_match.start()
        content = content[:actual_pos] + new_line + content[actual_pos + len(old_text):]
        align_changes += 1

    print("  Alignment text: %d updated" % align_changes)
    changes += align_changes

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print("OK: math_outline.py updated (%d total changes)" % changes)


def main():
    print("=" * 60)
    print("Fixing alignment issues...")
    print("=" * 60)
    fix_sync_script()
    fix_math_outline()
    print("\nDone. Now run: python scripts/sync_math_to_appjs.py")
    print("Then: python -X utf8 学习对齐研究/validate_sync.py")


if __name__ == "__main__":
    main()
