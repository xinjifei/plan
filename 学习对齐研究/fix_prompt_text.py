"""
批量修正 math_outline.py 中【与主计划的关联】段落，
使其 Main Day 编号与新的 syncMain 一致。
"""
import re
from pathlib import Path

# ============================================================
# Main Day → 该天在学什么的简短描述
# 格式: { main_day: "今天 Main Day X 正在学：..." }
# ============================================================
MAIN_DAY_TOPICS = {
    39: "pytest参数化 + Fixture——批量验证思维",
    40: "缓冲/复习日——回顾本周工程工具",
    41: "代码质量工具——ruff 格式化 + AI 代码审查",
    42: "工程基座综合验收 + AI协作工作流建立",
    43: "缓冲/复习日——整理工程工具知识",
    44: "缓冲/复习日——回顾阶段知识",
    45: "缓冲/复习日——准备进入金融数学阶段",
    46: "随机变量、期望值、方差——全用股票收益率数据可视化理解",
    47: "相关性、协方差矩阵——用10只股票计算并画热力图",
    48: "假设检验直觉——用 bootstrap 模拟理解策略的 Sharpe 是否显著",
    49: "股票是什么？交易所机制、A股规则",
    # 后续日子用于模块三+
    67: "Embedding是什么？——「国王-男人+女人≈女王」",
    68: "Context Window、Temperature、Top-P——这些参数如何影响输出",
    69: "System Prompt vs User Prompt——学会「调教」模型行为",
    71: "基础Prompt技巧——角色设定、Few-shot、Chain-of-Thought",
    73: "用AI分析一份财报摘要——设计Prompt提取关键财务指标",
    75: "用AI生成交易策略思路——Few-shot让AI模仿已知策略模式",
    77: "Prompt版本管理——把Prompt当代码一样管理",
    79: "ChromaDB 基础——什么是向量数据库？",
    80: "文档分块（Chunking）策略——研报太长怎么切？",
    81: "构建一个研报知识库",
    82: "RAG 问答系统——「最近三个月宁德时代的研报都说了什么？」",
    84: "前视偏差、幸存者偏差、过拟合——回测的三大死穴",
    86: "手写一个最简单的向量化回测——「金叉买、死叉卖」",
    91: "因子研究——什么是Alpha因子？常见因子类型",
    93: "因子IC分析——这个因子真的能预测收益吗？",
    95: "Sharpe Ratio、Max Drawdown、Calmar Ratio——只看收益率是不够的",
    97: "蒙特卡洛模拟——随机打乱交易顺序检验显著性",
    98: "策略衰减检测——什么信号表明策略过期了？",
    99: "综合验收——输出完整的策略研究报告",
    124: "仓位管理基础——Kelly公式、等权重、风险平价",
    128: "风控与Agent集成——Agent做决策前必须先过风控",
    156: "进阶数学——信息论入门：KL散度与模型比较的直觉",
    158: "进阶数学——贝叶斯定理的量化应用场景",
    160: "进阶数学——马尔可夫链与状态转移思维",
    162: "进阶数学——数值方法：梯度之外的优化思路",
    164: "进阶数学——凸优化的基本直觉",
    166: "进阶数学——决策树的数学原理",
    169: "进阶数学——正则化：防止过拟合的数学手段",
    171: "进阶数学——维度诅咒与几何直觉",
    175: "终局综合验收",
}

# ============================================================
# 新的 syncMain 映射（与 sync_math_to_appjs.py SYNC_MAIN_MAP 一致）
# ============================================================
NEW_SYNC = {
    1:39,2:40,3:41,4:42,5:43,6:44,7:45,8:46,9:46,10:46,11:47,
    12:48,13:48,14:48,15:48,16:48,17:48,18:48,
    19:47,20:47,21:93,22:91,23:84,
    24:67,25:67,26:68,27:67,28:79,29:79,30:79,31:81,
    32:82,33:82,34:67,35:71,36:73,37:75,38:77,39:79,
    40:86,41:86,42:86,43:91,44:124,45:95,46:95,
    47:128,48:93,49:48,50:97,51:98,52:99,
    53:156,54:158,55:160,56:162,57:164,58:166,59:169,60:171,61:175,
}


def fix_association_text(filepath):
    """遍历 math_outline.py，找到每个 day 的【与主计划的关联】段落并更新"""
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    # 找到每个 Math Day 的边界
    # 每个 day 以 "{第 N 天}｜" 开始
    day_pattern = re.compile(r'\{第 (\d+) 天\}')

    # 策略：找到每个 day 的【与主计划的关联】段落后，找到第一行"今天 Main Day X"
    # 替换为新的 main day 对应的描述

    changes = 0
    for match in day_pattern.finditer(content):
        math_day = int(match.group(1))
        new_sync = NEW_SYNC.get(math_day)
        if new_sync is None:
            continue

        # 找到这个 day 后面的【与主计划的关联】段落
        day_start = match.start()
        # 搜索后面500字符内的关联段落
        segment = content[day_start:day_start+3000]

        assoc_match = re.search(r'(【与主计划的关联】\n\s*)(?:今天 Main Day \d+|同样对应 Main Day \d+)[^\n]*', segment)
        if not assoc_match:
            continue

        # 获取新的主计划描述
        new_topic = MAIN_DAY_TOPICS.get(new_sync)
        if new_topic is None:
            # 没有详细描述，用默认格式
            new_topic = f"主计划 Day {new_sync}"

        # 决定替换文本的格式
        old_line = assoc_match.group(0)
        full_match_start = day_start + assoc_match.start()
        full_match_end = day_start + assoc_match.end()

        # 构建新行
        prefix = assoc_match.group(1)  # "【与主计划的关联】\n            "
        new_line = f"{prefix}今天 Main Day {new_sync} 正在学：{new_topic}。"

        if old_line != new_line:
            # 还需要检查后面的 "你正在..." 行是否有提到旧 day 编号的
            # 这里先只替换第一行，大多数情况足够
            content = content[:full_match_start] + new_line + content[full_match_end:]
            changes += 1
            print(f"  Day {math_day}: Main {old_line.strip()[-60:]} → Main {new_sync}")

    if changes > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n修正了 {changes} 处【与主计划的关联】段落")
    else:
        print("\n没有找到需要修正的段落")

    return changes


def main():
    fpath = Path(r"D:\PY_practice_file\plan\math_outline.py")
    print("=== 修正【与主计划的关联】段落 ===\n")
    fix_association_text(fpath)
    print("\n✅ 完成。请运行 sync_math_to_appjs.py 同步到 app.js")


if __name__ == '__main__':
    main()
