"""
修正 syncMain 值，使其满足「syncMain ≤ Main 轨道首次需要该概念的日子」。
同时更新 math_outline.py 中的【同步：Main Day X】行（显示一致性），
以及 sync_math_to_appjs.py 中的 SYNC_MAIN_MAP（实际数据源）。
"""
import re
from pathlib import Path

PLAN_DIR = Path(r"D:\PY_practice_file\plan")

# ============================================================
# 核心：修正后的 SYNC_MAIN_MAP
# 规则：syncMain = Main 轨道「第一次需要该概念」的 globalDay
# ============================================================
CORRECTED_SYNC = {
    # 模块一：数学思维基础 (Days 1-11) → Main 39-47 区间
    1: 39,   # 函数思维 → Main Day 39 (pytest/function params)
    2: 40,   # 坐标 → Main Day 40
    3: 41,   # 斜率 → Main Day 41
    4: 42,   # 随机 → Main Day 42
    5: 43,   # 随机变量 → Main Day 43
    6: 44,   # 概率分布 → Main Day 44
    7: 45,   # 缓冲
    8: 46,   # 正态分布 → Main 46 (随机变量/期望值/方差 当天顺带)
    9: 46,   # 期望值 → Main 46
    10: 46,  # 方差与标准差 → Main 46 (阶段二附加 Day 1: 随机变量/期望值/方差)
    11: 47,  # 相关性 → Main 47 (阶段二附加 Day 2: 相关性/协方差矩阵)

    # 模块二：统计推断 (Days 12-23)
    #   这些是 Bootstrap/假设检验 的前置知识，Main 48 集中用到
    12: 48,  # 样本 vs 总体 → Bootstrap 依赖
    13: 48,  # 大数定律 → Bootstrap 依赖
    14: 48,  # 中心极限定理 → Bootstrap 依赖
    15: 48,  # 假设检验 → Main 48 核心概念
    16: 48,  # p值深入 → Main 48 讨论
    17: 48,  # 两类错误 → Main 48 辅助
    18: 48,  # 缓冲（模块一二回顾）
    19: 47,  # 协方差 → Main 47 (阶段二附加 Day 2: 协方差矩阵)
    20: 47,  # 简单线性回归 → 与协方差紧密相关
    21: 93,  # R² → Main 93 (因子IC分析)
    22: 93,  # 多元回归 → Main 93 (因子评估)
    23: 84,  # 过拟合 → Main 84 (回测三大死穴)

    # 模块三：线性代数基础 (Days 24-39) → AI核心技术阶段
    24: 67,  # 向量 → Main 67 (Embedding)
    25: 67,  # 向量加减 → Main 67
    26: 68,  # 标量乘法/线性组合
    27: 69,  # 点积/余弦相似度 → Main 69 (ChromaDB语义搜索)
    28: 79,  # 矩阵 → Main 79 (ChromaDB/向量数据库)
    29: 80,  # 矩阵乘法 → Main 80 (Attention内部)
    30: 80,  # 转置 → Main 80
    31: 81,  # 缓冲
    32: 82,  # 特征向量
    33: 82,  # PCA
    34: 67,  # Embedding数学 → Main 67
    35: 71,  # Softmax → Main 71 (Temperature参数)
    36: 73,  # 梯度下降 → Main 73
    37: 75,  # 信息熵 → Main 75
    38: 77,  # 交叉熵 → Main 77
    39: 79,  # 模块三复习

    # 模块四：计算思维数学 (Days 40-52) → 量化回测阶段
    40: 86,  # 收益率/对数收益率 → Main 86 (向量化回测)
    41: 86,  # 年化 → Main 86
    42: 86,  # 复利/几何平均 → Main 86
    43: 91,  # 组合收益与风险 → Main 91 (因子研究)
    44: 124, # Big O → 独立知识
    45: 95,  # Sharpe Ratio → Main 95 (Sharpe/MaxDD/Calmar)
    46: 95,  # 最大回撤 → Main 95
    47: 128, # 图与网络 → Main 128 (Agent图结构)
    48: 93,  # IC与Rank IC → Main 93 (因子IC分析)
    49: 48,  # Bootstrap → Main 48 (阶段二附加 Day 3)
    50: 97,  # 蒙特卡洛 → Main 97 (蒙特卡洛模拟)
    51: 98,  # 自相关 → Main 98 (策略衰减检测)
    52: 99,  # 模块四复习

    # 模块五：进阶数学 (Days 53-61) → Agent架构阶段
    53: 156, # KL散度
    54: 158, # 贝叶斯思维
    55: 160, # 马尔可夫链
    56: 162, # 数值方法
    57: 164, # 凸优化
    58: 166, # 决策树
    59: 169, # 正则化
    60: 171, # 高维空间/维度诅咒
    61: 175, # 终局复习
}


def fix_math_outline_sync_lines(filepath, sync_map):
    """修正 math_outline.py 中的【同步：Main Day X】行"""
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    def replace_sync(match):
        day_num = int(match.group(1))
        new_sync = sync_map.get(day_num, match.group(2))
        return f"【同步：Main Day {new_sync}】"

    new_content = re.sub(
        r'【同步：Main Day (\d+)】',
        lambda m: replace_sync(re.match(r'【同步：Main Day (\d+)】', m.group())),
        content
    )

    # More precise: match the actual pattern in the file
    pattern = re.compile(r'【同步：Main Day (\d+)】')

    def get_day_num_from_context(match):
        # We need to know which Math Day this belongs to
        # The sync line appears right before {第 X 天}
        # We'll search backwards for the day number
        pos = match.start()
        before = content[max(0, pos-200):pos]
        day_match = re.search(r'\{第 (\d+) 天\}', before)
        if day_match:
            math_day = int(day_match.group(1))
            new_sync = sync_map.get(math_day)
            if new_sync is not None:
                return f'【同步：Main Day {new_sync}】'
        return match.group()

    new_content = pattern.sub(get_day_num_from_context, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # Count changes
    old_syncs = pattern.findall(content)
    new_syncs = pattern.findall(new_content)
    changes = sum(1 for o, n in zip(old_syncs, new_syncs) if o != n)
    print(f"  math_outline.py: {changes} 处 syncMain 已修正")

    return changes


def fix_sync_main_map(filepath, sync_map):
    """修正 sync_math_to_appjs.py 中的 SYNC_MAIN_MAP"""
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    # Find SYNC_MAIN_MAP block
    map_start = content.find('SYNC_MAIN_MAP = {')
    if map_start == -1:
        print("ERROR: SYNC_MAIN_MAP not found")
        return 0

    map_end = content.find('}', map_start)
    if map_end == -1:
        print("ERROR: closing } not found")
        return 0

    # Generate new SYNC_MAIN_MAP
    lines = ['SYNC_MAIN_MAP = {']
    for day in sorted(sync_map.keys()):
        lines.append(f'    {day}: {sync_map[day]},')
    lines.append('}')

    new_block = '\n'.join(lines)
    new_content = content[:map_start] + new_block + content[map_end+1:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"  sync_math_to_appjs.py: SYNC_MAIN_MAP 已更新 ({len(sync_map)} 天)")
    return len(sync_map)


def main():
    print("=== 修正双轨 syncMain 标签 ===\n")

    # 1. Fix math_outline.py
    math_path = PLAN_DIR / "math_outline.py"
    print("1. 修正 math_outline.py...")
    fix_math_outline_sync_lines(math_path, CORRECTED_SYNC)

    # 2. Fix sync_math_to_appjs.py
    sync_script_path = PLAN_DIR / "sync_math_to_appjs.py"
    print("\n2. 修正 sync_math_to_appjs.py...")
    fix_sync_main_map(sync_script_path, CORRECTED_SYNC)

    print("\n✅ 完成。请运行 sync_math_to_appjs.py 同步到 app.js")


if __name__ == '__main__':
    main()
