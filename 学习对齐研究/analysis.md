# 双轨学习对齐问题：根因分析与对策

> 2026-06-16，基于 Day 47-48 的实际学习体验暴露的系统性问题

---

## 一、问题复现：实际遇到的错位

用户当前进度：**Main Day 48**（假设检验 + Bootstrap）

| 实际发生的事 | 问题 |
|-------------|------|
| Main Day 47 学了协方差矩阵 | 数学轨道还没教协方差（它要到 Math Day 19，同步 Main Day **91**） |
| Main Day 48 学了 Bootstrap | 数学轨道还没教 Bootstrap（它要到 Math Day 49，同步 Main Day **133**） |
| Math Day 10 今天教方差标准差 | 这个内容 Main 轨道早在 Day 46 就用过了（阶段二附加 Day 1） |
| Math Day 11 明天教相关性 | 这个内容 Main 轨道昨天（Day 47）就用过了 |

**症状：数学轨道教的比主轨道需要的时间晚 0~85 天。**

---

## 二、具体数据：五个关键概念的错位

追踪 Main 轨道五个核心概念的实际使用时间 vs Math 轨道声称的同步时间：

| 概念 | Main 实际使用日 | Math syncMain 标签 | 偏差 | 影响 |
|------|:---------:|:----------:|:----:|------|
| 方差/标准差 | **Day 46**（阶段二附加 Day 1） | **48** | +2 天 | 数学晚了两天，用户已在 Main 用过了 |
| 相关性 | **Day 47**（阶段二附加 Day 2） | **49** | +2 天 | 同上 |
| 协方差 | **Day 47**（同上） | **91** | **+44 天** | 数学晚了近两个月 |
| 假设检验框架 | **Day 48**（阶段二附加 Day 3） | **87**（Math Day 15） | **+39 天** | 同上 |
| Bootstrap | **Day 48**（同上） | **133**（Math Day 49） | **+85 天** | 数学晚了近三个月 |

**结论：syncMain 标签和实际依赖关系完全脱节。Main 轨道先用到概念，Math 轨道数月后才教。**

---

## 三、根因分析

### 3.1 架构层面的根本矛盾

两个轨道有**不同的设计逻辑**：

| | Main 轨道（mine_outline.py） | Math 轨道（math_outline.py） |
|---|---|---|
| 设计逻辑 | 按**实用需求**驱动——需要用到了就引入概念 | 按**数学学科**驱动——函数→随机→分布→推断→矩阵→… |
| 概念引入顺序 | 方差→相关性→协方差→Bootstrap（4 天密集推进） | 方差（Day 10）→…→相关性（Day 11）→…→协方差（Day 19）→…→Bootstrap（Day 49） |
| 时间跨度 | 1 个概念/天 | 方差到 Bootstrap 横跨 39 个数学日 |

Main 轨道把方差、相关性、协方差、Bootstrap 在 **4 天**内密集推进，而 Math 轨道把这些概念分散在 **39 天**的教学进度中。两边的节奏根本不同——这不是「没对齐」，是「无法对齐」，因为设计哲学完全不同。

### 3.2 之前的「对齐」为什么会失败（机器幻觉的本质）

之前执行对齐任务时，发生了以下过程：

```
输入：math_outline.py + mine_outline.py
处理：模型扫描两个文件，按关键词匹配
      "方差"关键词 → 找到 Main 轨道中「方差」首次出现的位置 → 阶段二附加 Day 1
      → 阶段二附加 Day 1 的全局日 ≈ Day 46
      → 但模型把阶段二的第几天误算，或错误地认为 Day 48 才涉及方差
      → syncMain = 48

      "Bootstrap"关键词 → 找到 Main 轨道中「Bootstrap」出现的位置
      → 在阶段五「蒙特卡洛模拟」附近（Day ~133）
      → syncMain = 133
```

**失败的根因不是模型不努力，而是模型做了「概念名匹配」而非「依赖关系分析」。**

模型问了错误的问题：
- ❌ 「Bootstrap 这个词在 Main 轨道哪里出现？」→ 找到 Day 133 附近（阶段五 蒙特卡洛模拟使用了 Bootstrap）
- ✓ 应该问：「Main 轨道 Day 48 的 Bootstrap 教学，需要哪些前置数学概念？」→ 方差、抽样、原假设 → 这些概念必须在 Day 48 **之前**的数学日完成

此外，还有两个加剧因素：

1. **Main 轨道同一个概念出现多次**：Bootstrap 在 Main Day 48（阶段二附加）和 Main Day 133（阶段五 蒙特卡洛检验）各出现一次。模型匹配到了后面的那次，把 syncMain 设成了 133。
2. **syncMain 标签是单向的**：Math 轨道说「我同步到 Main Day X」，但没有机制检查 Main Day X 是否真的需要这个数学概念在那一天。

### 3.3 为什么这个错误是系统性的

不是个别天的 syncMain 标错，而是整个 Math 轨道的 syncMain 标签都是按「关键词相似度」生成的。以下模式反复出现：

| Math 概念 | syncMain 指向 | 实际应该是 | 错误类型 |
|-----------|:-----------:|:--------:|------|
| 方差（Day 10） | 48 | ≤46 | 匹配到了后面出现的位置 |
| 相关性（Day 11） | 49 | ≤47 | 同上 |
| 协方差（Day 19） | 91 | ≤47 | 匹配到了阶段五的因子 IC 部分 |
| 假设检验（Day 15） | 87 | ≤48 | 匹配到了阶段五的策略评估部分 |
| Bootstrap（Day 49） | 133 | ≤48 | 匹配到了阶段五的蒙特卡洛检验 |
| Sharpe（Day 45） | 125 | ≤48（阶段二附加 Day 3 已在用） | 匹配到了阶段五的 Sharpe 专项 |
| IC（Day 48） | 130 | 应匹配阶段五 Day ~90+ | 勉强对但时间差大 |

**整个 syncMain 列的生成逻辑是错的：它把 Math 概念匹配到了 Main 轨道「最详细讨论该概念」的位置，而不是「第一次需要使用该概念」的位置。**

---

## 四、对策

### 4.1 原则

1. **syncMain 应该指向 Main 轨道「第一次需要该数学概念」的日期，而非「最详细讨论该概念」的日期**
2. **syncMain 必须满足：Main Day X 用到的所有 Math 概念，其 syncMain ≤ X**
3. **不调整两个轨道的内容和内部顺序（遵守约束）**
4. **建立一个可编程验证的检查机制，防止未来再次出现幻觉**

### 4.2 具体方案：依赖导向的 syncMain 重标定

**Step 1：建立依赖映射表**

为 Main 轨道每一天标注其依赖的 Math 概念：

| Main Day | 主题 | 依赖的 Math 概念 |
|:--------:|------|-----------------|
| 46 | 随机变量、期望值、方差 | 随机性(Day 4)、随机变量(Day 5)、概率分布(Day 6)、正态分布(Day 8)、期望值(Day 9)、**方差(Day 10)** |
| 47 | 相关性、协方差矩阵 | 方差(Day 10)、**相关性(Day 11)**、**协方差(Day 19)** |
| 48 | 假设检验 + Bootstrap | 方差(Day 10)、样本vs总体(Day 12)、大数定律(Day 13)、假设检验(Day 15)、**Bootstrap(Day 49)** |

**Step 2：验证 syncMain 约束**

对每个 Main Day X 的每个依赖概念 C，检查：`Math[C].syncMain ≤ X`

如不满足 → 调整 syncMain。如 Math Day 49 (Bootstrap) 的 syncMain 从 133 改为 ≤48。

**Step 3：处理「同一概念多处使用」**

若一个 Math 概念在 Main 轨道多处用到，syncMain 取**第一次使用**的日期。

**Step 4：标注而非隐藏矛盾**

那些 syncMain 远大于概念首次使用日的（如协方差 → 47 但 syncMain 现在是 91），修改 syncMain 使之诚实。不改 Math 轨道内容或顺序。

### 4.3 防退化机制：可编程的验证脚本

创建一个 Python 脚本 `plan/validate_sync.py`，每次修改 math_outline.py 后运行：

```python
# 伪代码
DEPENDENCIES = {
    46: [10],        # Main Day 46 依赖 Math Day 10 (方差)
    47: [10, 11, 19], # Main Day 47 依赖 Math Day 10/11/19
    48: [10, 12, 13, 15, 49], # Main Day 48 依赖这些 Math Days
    # ...
}

for main_day, required_math_days in DEPENDENCIES.items():
    for math_day in required_math_days:
        actual_sync = get_syncMain(math_day)
        if actual_sync > main_day:
            print(f"❌ Math Day {math_day} syncMain={actual_sync} "
                  f"但 Main Day {main_day} 需要它 (偏差 {actual_sync - main_day} 天)")
```

**关键：这个脚本不依赖 AI 判断——它只检查硬约束 `syncMain ≤ 首次使用日`。这是一个纯机械检查，不会被幻觉影响。**

### 4.4 务实接受：有些不同步是结构性的

即使做完以上修复，仍会存在一些结构性不同步：

- Math 轨道 模块四的 Sharpe/IC/Bootstrap 等量化概念，其内部教学顺序是固定的（必须先教收益率 → 年化 → Sharpe → Bootstrap）
- Main 轨道 阶段二附加 在 Day 46-48 就密集引入了这些概念
- 解决方案：在 Math 轨道的 prompt 中加入诚实的声明，如「注：你在 Main Day 48 已经用过 Bootstrap 了，今天是深入理解它的数学原理」

---

## 五、实施步骤

1. **建立完整的依赖映射表**（遍历 Main 轨道每一天，标注数学依赖）
2. **运行验证脚本**，标记所有违反约束的 syncMain
3. **在 math_outline.py 中修正所有 syncMain 标签**
4. **重新运行 sync_math_to_appjs.py** 同步到 app.js
5. **将 validate_sync.py 加入 .claude/settings.json 的 hook**（每次修改 math_outline.py 后自动运行）
6. **在 math_rewrite_principles.md 中补充本节分析**，作为未来修改的约束条件

---

## 六、关键认知

这次问题的本质是：**之前的对齐操作把「概念关键词匹配」当成了「依赖关系分析」**。模型擅长前者（模式识别），不擅长后者（因果推理，需要在两个文件之间追踪依赖链）。

解决方案的核心不是「让 AI 更仔细地对齐」，而是**建立一个不依赖 AI 判断的硬约束检查机制**——用脚本验证 `syncMain ≤ 首次使用日`。这个约束是数学性质的，不需要智能判断，只需要一张事先约定好的依赖表。
