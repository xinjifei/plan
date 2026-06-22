# 双轨对齐实施方案

> 基于 analysis.md 的分析结论，制定具体实施步骤

---

## 前置确认：两个轨道的时间线

用户每天同时推进一个 Main Day + 一个 Math Day（25min）。关键事实：

```
日历第 N 天 → Main Day N + Math Day N（同时推进）
```

因此约束为：**Main Day X 需要的 Math 概念，其 Math Day 编号必须 ≤ X。**

---

## Step 1：建立 Main → Math 依赖映射表

遍历 Main 轨道每一天，找出其依赖的 Math 概念及其 Math Day 编号。

### 1.1 阶段一（Main Day 1-12）：Python 概念速览

此阶段不涉及概率统计数学概念，无依赖。

### 1.2 阶段二·技术指标（Main Day 39-41）：pandas_ta 调用

无新增数学依赖（纯工具调用）。

### 1.3 阶段二·数据管道（Main Day 42-49）：工程基座 + 金融数学

| Main Day | 主题 | 依赖的 Math 概念 | Math Day | 当前 syncMain | 需改为 |
|:--------:|------|-----------------|:--------:|:----------:|:-----:|
| 42 | 工程基座综合验收 | 无新数学依赖 | — | — | — |
| 43 | 缓冲/复习 | — | — | — | — |
| 44 | 缓冲/复习 | — | — | — | — |
| **45** | 缓冲/复习 | — | — | — | — |
| **46** | 随机变量、期望值、方差 | 随机(D4)、随机变量(D5)、概率分布(D6)、正态(D8)、期望值(D9)、**方差(D10)** | 4,5,6,8,9,10 | D10→48 | D10→**46** |
| **47** | 相关性、协方差矩阵 | 方差(D10)、**相关性(D11)**、**协方差(D19)** | 10,11,19 | D11→49, D19→91 | D11→**47**, D19→**47** |
| **48** | 假设检验 + Bootstrap | 方差(D10)、样本vs总体(D12)、大数定律(D13)、中心极限(D14)*、假设检验(D15)、p值(D16)*、**Bootstrap(D49)** | 10,12,13,14,15,16,49 | D15→87, D49→133 | D15→**48**, D49→**48** |
| 49 | 股票/交易所/A股规则 | 无新数学依赖 | — | — | — |

> \* 中心极限定理(D14)和p值深入(D16)是「最好已有但非硬依赖」

### 1.4 阶段二·工程基座（Main Day 50-59）

| Main Day | 依赖 | Math Day | 当前 syncMain | 需改为 |
|:--------:|------|:--------:|:----------:|:-----:|
| 50-59 | uv/Git/typing/logging/pytest/ruff | 无新数学依赖 | — | — |

### 1.5 阶段二附加·金融数据（Main Day 60-69）

| Main Day | 主题 | 依赖 | Math Day | 当前 syncMain | 需改为 |
|:--------:|------|------|:--------:|:----------:|:-----:|
| 60 | K线图、成交量、换手率 | 无新数学依赖 | — | — | — |
| 61 | 缓冲 | — | — | — | — |
| 62 | matplotlib 子图 | 无新数学依赖 | — | — | — |
| 63 | seaborn/plotly | 无新数学依赖 | — | — | — |
| 64 | SQLite 基础 | 无新数学依赖 | — | — | — |
| 65 | pandas+SQL | 无新数学依赖 | — | — | — |
| 66 | 综合数据管道 | 无新数学依赖 | — | — | — |

> 注：阶段二附加的 Day 编号需要对照 mine_outline.py 确认。以上为近似。

### 1.6 阶段三·产品思维（Main Day ~70-77）

无新增数学依赖。

### 1.7 阶段四·AI 核心技术（Main Day ~78-99）

| Main Day | 主题 | 依赖 | Math Day | 当前 syncMain | 需改为 |
|:--------:|------|------|:--------:|:----------:|:-----:|
| Token/Embedding | Embedding 数学 | 向量(D24)、点积(D27)、Softmax(D35) | 24,27,35 | 需确认 | 需确认 |
| Context Window/Temp | LLM 参数 | Softmax(D35) | 35 | 需确认 | 需确认 |
| Prompt Engineering | 系统提示词 | 无新数学依赖 | — | — | — |
| RAG/ChromaDB | 向量检索 | 点积(D27)、余弦相似度(D27) | 27 | 需确认 | 需确认 |
| Attention | Q×Kᵀ×V | 矩阵(D28)、矩阵乘法(D29)、转置(D30)、Softmax(D35) | 28,29,30,35 | 需确认 | 需确认 |
| 梯度下降 | 模型训练 | 梯度下降(D36) | 36 | 需确认 | 需确认 |
| 交叉熵 | 损失函数 | 熵(D37)、交叉熵(D38) | 37,38 | 需确认 | 需确认 |

### 1.8 阶段五·量化回测（Main Day ~100-119）

| Main Day | 主题 | 依赖 | Math Day | 当前 syncMain | 需改为 |
|:--------:|------|------|:--------:|:----------:|:-----:|
| 回测基础 | 前视偏差/过拟合 | 过拟合(D23) | 23 | 需确认 | 需确认 |
| 向量化回测 | SMA 金叉死叉 | 收益率(D40)、年化(D41) | 40,41 | 需确认 | 需确认 |
| Sharpe/MaxDD | 策略评估 | Sharpe(D45)、MaxDD(D46) | 45,46 | D45→125, D46→126 | 需确认 |
| IC 分析 | 因子评估 | 相关性(D11)、IC(D48) | 11,48 | D48→130 | 需确认 |
| 因子合成 | 多因子组合 | 多元回归(D22) | 22 | 需确认 | 需确认 |
| Walk-Forward | 滚动验证 | 样本/总体(D12) | 12 | 需确认 | 需确认 |
| 蒙特卡洛检验 | 随机打乱 | Bootstrap(D49)、蒙特卡洛(D50) | 49,50 | D50→135 | 需确认 |

### 1.9 阶段六·服务部署（Main Day ~120-137）

无新增数学依赖（工程为主）。

### 1.10 阶段七·Agent 架构（Main Day ~138-157）

无新增数学依赖（架构为主）。

---

## Step 2：修正 math_outline.py 的 syncMain 标签

按上表「需改为」列，修改 math_outline.py 中每个 `【同步：Main Day X】` 行。

变更清单：

| Math Day | 旧 syncMain | 新 syncMain | 理由 |
|:--------:|:----------:|:----------:|------|
| 10 | 48 | **46** | 方差在 Main Day 46 首次使用 |
| 11 | 49 | **47** | 相关性在 Main Day 47 首次使用 |
| 12 | 84 | **48** | 样本概念在 Bootstrap(Day 48) 就需要 |
| 13 | 85 | **48** | 大数定律在 Bootstrap(Day 48) 就需要 |
| 14 | 86 | **48** | 中心极限定理辅助理解 Bootstrap |
| 15 | 87 | **48** | 假设检验框架在 Main Day 48 就需要 |
| 16 | 88 | **48** | p值深入在 Main Day 48 讨论中极有用 |
| 19 | 91 | **47** | 协方差在 Main Day 47 首次使用 |
| 45 | 125 | ~**100** | Sharpe 在阶段五回测评估首次使用 |
| 46 | 126 | ~**100** | MaxDD 同上 |
| 48 | 130 | ~**110** | IC 在因子评估阶段首次使用 |
| 49 | 133 | **48** | Bootstrap 在 Main Day 48 首次使用 |
| 50 | 135 | ~**115** | 蒙特卡洛在阶段五首次使用 |

> 标注 ~ 的值为估算，需对照 mine_outline.py 的精确 Main Day 编号确认。

---

## Step 3：创建验证脚本 `plan/validate_sync.py`

一个纯机械检查脚本，不依赖 AI 判断：

```python
"""
双轨对齐验证脚本
================
检查每条规则：Math Day 的 syncMain 必须 ≤ Main 轨道首次需要该概念的日子。
纯数字比较，不依赖任何 AI 判断。
"""

# ============================================================
# 依赖映射表（手工维护，是唯一需要人工判断的部分）
# 格式: {main_day: [required_math_days]}
# ============================================================
DEPENDENCIES = {
    46: [4, 5, 6, 8, 9, 10],       # 随机变量/期望值/方差
    47: [10, 11, 19],               # 相关性/协方差矩阵
    48: [10, 12, 13, 14, 15, 16, 49],  # Bootstrap/假设检验
    # 后续按 Step 1 的完整映射表补充
    # ...
}

# ============================================================
# syncMain 数据（从 math_outline.py 提取，或直接从 app.js 读取）
# 格式: {math_day: syncMain}
# ============================================================
SYNC_MAIN = {
    1: 39, 2: 40, 3: 41, 4: 42, 5: 43, 6: 44, 7: 45,
    8: 46, 9: 47, 10: 48, 11: 49, 12: 84, 13: 85,
    14: 86, 15: 87, 16: 88, 17: 89, 18: 90, 19: 91,
    20: 92, 21: 93, 22: 94, 23: 95,
    # ... 完整61天
}


def validate():
    errors = []
    warnings = []

    for main_day, required_math_days in DEPENDENCIES.items():
        for math_day in required_math_days:
            actual_sync = SYNC_MAIN.get(math_day, None)
            if actual_sync is None:
                errors.append(f"Math Day {math_day} 不在 SYNC_MAIN 中")
                continue
            if actual_sync > main_day:
                errors.append(
                    f"❌ Math Day {math_day} syncMain={actual_sync}, "
                    f"但 Main Day {main_day} 需要它 "
                    f"(晚了 {actual_sync - main_day} 天)"
                )
            elif actual_sync == main_day:
                warnings.append(
                    f"⚠️  Math Day {math_day} syncMain={actual_sync} "
                    f"与 Main Day {main_day} 同天——刚好赶上，但建议提前"
                )

    # 检查是否有 Math Day 的 syncMain 小于上一个 Math Day（syncMain 应单调或持平）
    prev_sync = 0
    for math_day in sorted(SYNC_MAIN.keys()):
        curr_sync = SYNC_MAIN[math_day]
        if curr_sync < prev_sync:
            warnings.append(
                f"⚠️  Math Day {math_day} syncMain={curr_sync} < "
                f"Math Day {math_day-1} syncMain={prev_sync}（syncMain 回退）"
            )
        prev_sync = curr_sync

    # 输出
    if errors:
        print(f"\n{'='*60}")
        print(f"❌ 发现 {len(errors)} 个硬约束违反（必须修复）：")
        print(f"{'='*60}")
        for e in errors:
            print(f"  {e}")

    if warnings:
        print(f"\n{'='*60}")
        print(f"⚠️  发现 {len(warnings)} 个警告（建议修复）：")
        print(f"{'='*60}")
        for w in warnings:
            print(f"  {w}")

    if not errors and not warnings:
        print("✅ 所有依赖检查通过，双轨对齐无问题。")

    return len(errors) == 0


if __name__ == "__main__":
    ok = validate()
    exit(0 if ok else 1)
```

## Step 4：将验证脚本接入 hook

在 `.claude/settings.local.json` 中注册 hook，每次修改 `math_outline.py` 后自动运行验证：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "ifContains": "math_outline.py",
        "command": "cd D:\\PY_practice_file\\plan && python validate_sync.py"
      }
    ]
  }
}
```

---

## Step 5：同步 math_outline.py → app.js

修改完 math_outline.py 后，运行现有的 `sync_math_to_appjs.py` 脚本同步到 app.js。

然后运行 `node -c app.js` 验证 JS 语法。

---

## Step 6：更新 math_rewrite_principles.md

在 `math_rewrite_principles.md` 的「四、数据对齐规则」部分补充：

```markdown
### 6. syncMain 赋值原则（2026-06-16 新增）

- syncMain 必须指向 Main 轨道 **第一次需要使用该数学概念** 的日期
- 禁止指向「最详细讨论该概念」的日期
- 每次修改后运行 `python validate_sync.py` 验证
- 硬约束：对 DEPENDENCIES 表中每个 (main_day, math_day) 对，SYNC_MAIN[math_day] ≤ main_day
- 此约束为机械检查，不接受 AI 判断覆盖
```

---

## 实施顺序总结

```
Step 1: 补完依赖映射表（手工，一次性工作）
   ↓
Step 2: 修正 math_outline.py 的 syncMain 标签
   ↓
Step 3: 创建 validate_sync.py 并填入完整数据
   ↓
Step 4: 配置 hook
   ↓
Step 5: 运行 sync_math_to_appjs.py 同步到 app.js
   ↓
Step 6: 更新 math_rewrite_principles.md
```

---

## 限制与诚实声明

1. **阶段四~七的依赖映射是估算**：需要对照 mine_outline.py 逐天精确确认 Main Day 编号后才能补完。
2. **Math 轨道模块二~五的部分 syncMain 可能需要回退**（新值 < 旧值）。这意味着 syncMain 不再保证单调递增——这在渲染层面不会造成问题（网页只是显示一个标签），但需要在渲染代码中确认。
3. **Math 轨道内部教学顺序不变**：Math Day 10 仍然教方差，只是它的 syncMain 标签从 48 改为 46。用户在 Main Day 46 时看到 sync badge 指向 Math Day 10（方差），但实际此时用户在 Math 轨道可能还只学到 Day 8-9。这是结构性矛盾——两个轨道推进速度相同但 Math 需要教的内容多。**折中：保持 syncMain 诚实标注依赖关系，接受「用户在 Main 轨道先用到概念，后在 Math 轨道深入理解」的现实。**
