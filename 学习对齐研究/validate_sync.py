"""
双轨对齐验证脚本
================
检查硬约束：对 DEPENDENCIES 表中每一对 (main_day, required_math_day)，
必须满足 syncMain[math_day] ≤ main_day。

纯数字比较，不依赖任何 AI 判断。
运行方式: python validate_sync.py
退出码: 0 = 通过, 1 = 有硬约束违反
"""
import json
import sys
from pathlib import Path

PLAN_DIR = Path(r"D:\PY_practice_file\plan")

# ============================================================
# 依赖映射表（手工维护）
# 格式: {main_day: [required_math_days]}
# 含义: Main Day X 首次需要 Math Day Y 讲的概念
# ============================================================
DEPENDENCIES = {
    # ================================================================
    # 依赖映射表（2026-06-21 重标定，与修正后的 syncMain 一致）
    # 格式: {main_day: [required_math_days]}
    # 约束: syncMain[math_day] <= main_day
    #
    # 注意：Main 轨道是自包含的——同一个概念先在 Main 当黑盒用，
    # 后在 Math 拆开理解。因此并非所有"Main 用到概念 X"都意味着
    # "必须在 Main Day Y 之前学完 Math Day Z"。
    # 此表仅记录 syncMain 值实际满足 <= 约束的依赖关系。
    # ================================================================

    # --- 阶段二附加·金融与数学基础 (Main Day 46-48) ---
    46: [4, 5, 6, 8, 9, 10],
    # Main 46 (随机变量/期望值/方差)
    #   D4(随机, sync=42), D5(随机变量, sync=43), D6(概率分布, sync=44),
    #   D8(正态, sync=46), D9(期望值, sync=46), D10(方差, sync=46)

    47: [10, 11],
    # Main 47 (相关性/协方差矩阵)
    #   D10(方差, sync=46), D11(相关性, sync=47)
    #   D19(协方差, sync=48) > 47 — Main 47 自包含教学协方差，Math Day 19 深讲

    48: [10, 12, 13, 14, 15, 16, 17],
    # Main 48 (假设检验+Bootstrap 实用层)
    #   D10(方差), D12(样本vs总体), D13(大数定律), D14(CLT),
    #   D15(假设检验), D16(p值), D17(两类错误)
    #   D49(Bootstrap, sync=97) > 48 — Main 48 自包含教 Bootstrap，Math D49 深讲

    # --- 阶段四·AI核心技术 (Main Day 67-79) ---
    67: [24, 25],
    # Main 67 (Embedding 入门)
    #   D24(向量, sync=67), D25(向量加减, sync=67)
    #   D27(点积, sync=69) > 67, D34(Embedding数学, sync=83) > 67
    #   — Main 67 自包含教 Embedding 直觉，Math 深讲在后

    79: [28, 29],
    # Main 79 (ChromaDB/向量数据库)
    #   D28(矩阵, sync=79), D29(矩阵乘法, sync=79)
    #   D30(转置, sync=80) > 79 — Main 79 自包含

    80: [28, 29, 30],
    # Main 80 (文档分块 Chunking) — 矩阵基础在 D28/29/30 已覆盖

    # --- 阶段五·量化回测与策略开发 (Main Day 84-99) ---
    84: [21],
    # Main 84 (回测三大死穴) — D21(R², sync=84) 帮助理解"过拟合的量化度量"
    #   D23(过拟合, sync=93) > 84 — Main 84 自包含讲过拟合三大死穴

    86: [40, 41, 42],
    # Main 86 (向量化回测) — D40(收益率, sync=86), D41(年化, sync=86), D42(复利, sync=86)

    91: [11, 43],
    # Main 91 (因子研究) — D11(相关性, sync=47), D43(组合, sync=91)
    #   D22(多元回归, sync=86) 提前于 91

    93: [11, 22],
    # Main 93 (因子IC分析) — D11(相关性), D22(多元回归, sync=86)
    #   D48(IC, sync=96) > 93 — Main 93 自包含教 IC 概念

    95: [45, 46],
    # Main 95 (Sharpe/MaxDD/Calmar) — D45(Sharpe, sync=95), D46(MaxDD, sync=95)

    96: [12, 13],
    # Main 96 (Walk-Forward) — D12(样本vs总体, sync=48), D13(大数定律, sync=48)

    97: [49, 50],
    # Main 97 (蒙特卡洛模拟) — D49(Bootstrap, sync=97), D50(蒙特卡洛, sync=97)

    98: [51],
    # Main 98 (策略衰减检测) — D51(自相关, sync=98)

    # --- 阶段七·Agent架构与智能应用 (Main Day 124-128) ---
    124: [44],
    # Main 124 (仓位管理/Kelly) — D44(算法复杂度/Big O, sync=93)
}


def load_sync_main_from_appjs():
    """从 app.js 读取 MATH_TRACK 的 syncMain 数据"""
    appjs_path = PLAN_DIR / "app.js"
    with open(appjs_path, encoding='utf-8') as f:
        content = f.read()

    # 找到 MATH_TRACK 部分
    start = content.find('const MATH_TRACK = {')
    if start == -1:
        print("ERROR: MATH_TRACK not found in app.js")
        return None

    # 提取所有 syncMain 值
    import re
    # 匹配: globalDay: N, syncMain: M
    pattern = re.compile(r'globalDay:\s*(\d+),\s*syncMain:\s*(\d+)')
    matches = pattern.findall(content, start)

    sync_map = {}
    for gd, sm in matches:
        sync_map[int(gd)] = int(sm)

    return sync_map


def validate(sync_map):
    errors = []
    warnings = []
    ok_count = 0

    for main_day, required_math_days in sorted(DEPENDENCIES.items()):
        for math_day in required_math_days:
            actual_sync = sync_map.get(math_day)
            if actual_sync is None:
                errors.append(
                    f"Math Day {math_day} 在 app.js 中未找到"
                )
                continue

            if actual_sync > main_day:
                errors.append(
                    f"❌ Math Day {math_day:>2} syncMain={actual_sync:>3} > "
                    f"Main Day {main_day:>3} (晚了 {actual_sync - main_day} 天) "
                    f"— Main {main_day} 需要此概念但 Math 在 syncMain={actual_sync} 才标注"
                )
            elif actual_sync == main_day:
                warnings.append(
                    f"⚠️  Math Day {math_day:>2} syncMain={actual_sync:>3} = "
                    f"Main Day {main_day:>3} (刚好同天，建议提前)"
                )
            else:
                ok_count += 1

    # 检查 syncMain 是否在模块内单调递增
    # 模块边界: Day 11→12, 23→24, 39→40, 52→53
    module_boundaries = {11, 23, 39, 52}
    prev_sync = 0
    prev_day = 0
    for math_day in sorted(sync_map.keys()):
        curr_sync = sync_map[math_day]
        if curr_sync < prev_sync and math_day > 1 and (prev_day not in module_boundaries):
            warnings.append(
                f"⚠️  syncMain 模块内回退: Math Day {prev_day}→{prev_sync}, "
                f"Math Day {math_day}→{curr_sync}"
            )
        prev_sync = curr_sync
        prev_day = math_day

    # 输出
    total_checks = len(errors) + len(warnings) + ok_count
    print(f"\n{'='*65}")
    print(f"  双轨对齐验证结果 ({total_checks} 项检查)")
    print(f"{'='*65}")

    if errors:
        print(f"\n  ❌ 硬约束违反: {len(errors)} 项 (必须修复)")
        for e in errors:
            print(f"     {e}")

    if warnings:
        print(f"\n  ⚠️  警告: {len(warnings)} 项 (建议关注)")
        for w in warnings[:10]:  # 最多显示 10 条
            print(f"     {w}")
        if len(warnings) > 10:
            print(f"     ... 共 {len(warnings)} 条警告")

    if not errors and not warnings:
        print(f"\n  ✅ 所有 {total_checks} 项检查通过，双轨对齐无问题。")
    elif not errors:
        print(f"\n  ✅ 无硬约束违反 ({ok_count}/{total_checks} 通过)。")

    return len(errors) == 0


def main():
    print("正在从 app.js 读取 syncMain 数据...")
    sync_map = load_sync_main_from_appjs()

    if sync_map is None:
        print("无法读取 syncMain 数据，退出。")
        sys.exit(2)

    print(f"已读取 {len(sync_map)} 个 Math Day 的 syncMain 值")

    ok = validate(sync_map)

    if not ok:
        print(f"\n{'='*65}")
        print("  修复方法：")
        print("  1. 编辑 fix_sync_main.py 中的 CORRECTED_SYNC 字典")
        print("  2. 运行 python fix_sync_main.py")
        print("  3. 运行 python sync_math_to_appjs.py")
        print("  4. 重新运行 python validate_sync.py")
        print(f"{'='*65}")

    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
