# 量化学习计划追踪器 (Plan Tracker)

> 双轨学习系统 — 主计划 137 天（Python → 量化 → AI → 部署 → Agent）+ 数学轨道 61 天 — 全部内置每日 Prompt + 任务清单，localStorage 持久化进度。

---

## 项目概览

一个纯前端 Web 应用，用于追踪「从零到量化交易 + AI Agent」的系统化学习计划。核心理念：**不记语法，让 AI 写代码；你学的是判断力、设计能力和领域理解。**

- **主轨道**（137 天，约 3 小时/天）：Python → 量化数据处理 → 工程基座 → 金融数学 → 产品思维 × AI 核心技术 → 回测与策略开发 → 服务部署 → Agent 架构
- **数学轨道**（61 天，约 25 分钟/天）：函数 → 概率分布 → 统计推断 → 线性代数 → 计算思维数学 → 进阶数学
- 两条轨道互相独立，Main 教「怎么用」（工具化），Math 教「为什么」（原理化）

---

## 技术架构

```
main/
├── index.html          # 入口页面（Glassmorphism 风格 UI）
├── css/
│   ├── tokens.css      # 设计令牌 — 所有可自定义的颜色/圆角/阴影/动画
│   ├── style.css       # 主样式 — 顶栏、侧栏、首页热力图、日详情页
│   └── overview.css    # 总览页 — 环形进度、连击卡片、双列思维导图
└── js/
    ├── data.js         # 全部学习数据 — MAIN_PLAN (137天) + MATH_TRACK (61天)
    ├── store.js        # 状态管理 — localStorage 读写、任务完成度、连胜计算
    ├── router.js       # Hash 路由 — #overview / #main / #math / #main-12 / #math-34
    ├── render.js       # 渲染逻辑 — 首页热力图、侧栏导航、日详情、总览页思维导图
    ├── streak-data.js  # 连胜配置 — 起始日期、基线天数、强制覆盖开关
    └── app.js          # 应用入口 — 初始化、Toast、键盘快捷键、浮动提示
```

### 数据流

```
mine_outline.py / math_outline.py     ← Python 源数据（仅用于生成）
        │
        ▼  scripts/*.py 同步脚本
main/js/data.js                       ← 前端唯一数据源（MAIN_PLAN + MATH_TRACK）
        │
        ▼  store.js 加载
localStorage                          ← 用户进度持久化（plan_tracker_main / plan_tracker_math）
        │
        ▼  render.js
DOM                                   ← 热力图 / 日详情 / Prompt 区 / 任务列表
```

### 路由设计

| Hash | 视图 | 说明 |
|------|------|------|
| `#overview` | 总览页 | 双环进度、连击、双列思维导图（主计划 ↔ 数学 syncMain 对齐） |
| `#main` | 主计划首页 | 7 阶段折叠面板 + 日格子热力图 |
| `#math` | 数学首页 | 5 模块折叠面板 + 日格子热力图 |
| `#main-12` | 主计划 Day 12 详情 | 面包屑、描述、Prompt、任务复选框 |
| `#math-34` | 数学 Day 34 详情 | 同上，含 `↗ 同步：Main Day N` 交叉引用 |
| `#read-main-56` | 总览页跳转的只读详情 | 简化导航，从思维导图点击进入 |

---

## 核心特性

- **Glassmorphism UI** — 深色渐变背景 + 毛玻璃卡片 + 镜面高光，全部 token 化可配置
- **热力图日格子** — 4 级完成度色阶（0% → 25% → 50% → 75% → 100%），hover 浮动提示
- **思维导图总览** — 左列 137 天主计划树结构，右列 61 天数学按 syncMain 自动对齐定位
- **SyncMain 交叉引用** — 数学轨道每天标注主计划首次使用该概念的位置，可一键跳转
- **离线可用** — 纯前端，localStorage 持久化，无需服务器
- **键盘快捷键** — `Ctrl+Enter` 完成下一个任务，`Esc` 返回首页
- **连胜追踪** — 两条轨道独立计算连续学习天数

---

## 设计系统

所有视觉参数集中在 `main/css/tokens.css` 中：

- **背景渐变**：`--grad-1` / `--grad-2` / `--grad-3`（3 色斜向渐变）
- **玻璃层级**：`--glass-xs` ~ `--glass-xl`（5 级透明度）
- **品牌色**：紫色 `--accent` + 青色 `--accent2` + 绿色 `--success`
- **热力图色阶**：`--c0` ~ `--c4`
- **动画曲线**：spring 系列（soft / smooth / bounce）
- **毛玻璃模糊**：`--blur-sm` ~ `--blur-xl`

---

## 文件清单

### 根目录（遗留 + 源数据）

| 文件/目录 | 用途 |
|-----------|------|
| `app.js` | 旧版单文件应用（353KB），已重构到 `main/` |
| `index_old.html` | 旧版入口页面 |
| `style.css` | 旧版样式 |
| `mine_outline.py` | 主计划 Python 源数据 |
| `math_outline.py` | 数学轨道 Python 源数据（61 天 × 7 字段 prompt） |
| `主轨道思维导图.md` | 137 天主计划思维导图 |
| `数学轨道思维导图.md` | 61 天数学轨道思维导图 |
| `docs/` | 双轨哲学、数学重写原则 |
| `scripts/` | Python 源数据 → JS 的同步/校验脚本 |
| `学习对齐研究/` | 双轨对齐问题分析、认知科学审计 |
| `data/` | 概念映射数据（concept_map.py → concept_map_data.js） |
| `archive/` | 历史备份、旧版 demo |
| `backup/` | localStorage 数据备份 JSON |

### 当前应用（`main/`）

| 文件 | 行数估算 | 职责 |
|------|----------|------|
| `index.html` | 129 | 页面结构，加载 CSS/JS |
| `css/tokens.css` | 92 | 设计令牌 |
| `css/style.css` | ~600 | 全局样式 + 首页 + 日详情 |
| `css/overview.css` | ~200 | 总览页样式 + 思维导图 |
| `js/data.js` | ~8000 | MAIN_PLAN 7 阶段 + MATH_TRACK 5 模块所有数据 |
| `js/store.js` | 42 | localStorage 状态管理 |
| `js/router.js` | 82 | Hash 路由分发 |
| `js/render.js` | 300 | 所有视图渲染逻辑 |
| `js/streak-data.js` | 30 | 连胜配置 |
| `js/app.js` | 26 | 初始化、Toast、快捷键 |

---

## 学习计划全景

```
主轨道 137 天（7 阶段）
│
├── 阶段一：Python核心概念速览（12天）       Day 1–12
│   变量→控制流→数据结构→函数→文件→异常→完整闭环
├── 阶段二：量化数据处理与工程基座（23天）    Day 23–45
│   数据管道（指标→清洗→定时→配置）+ 工程基座（uv→Git→pytest→ruff）
├── 阶段二附加：金融与数学基础（12天）         Day 46–57
│   统计实战 + 金融市场 + 可视化 + SQL
├── 阶段三 & 四（并行）                       Day 57–79
│   产品思维（痛点→MVP→验证）+ AI核心技术（Token→Prompt→RAG→投研助手）
├── 阶段五：量化回测与策略开发（20天）        Day 80–99
│   回测→因子→IC→Sharpe→Walk-Forward→蒙特卡洛→策略报告
├── 阶段六：服务部署与自动化（18天）          Day 100–117
│   FastAPI→定时任务→数据库→Docker→一键部署
└── 阶段七：Agent架构与智能应用（20天）       Day 118–137
    LangGraph→工具调用→风控→衰减监控→自动迭代→终局系统

数学轨道 61 天（5 模块）
│
├── 模块一：数学思维基础（11天）   函数→随机→概率→正态→期望→方差→相关性
├── 模块二：统计推断（12天）        样本→大数定律→CLT→假设检验→p值→回归→过拟合
├── 模块三：线性代数基础（16天）    向量→矩阵→Embedding→Softmax→梯度下降→交叉熵
├── 模块四：计算思维数学（13天）    收益率→Sharpe→MaxDD→IC→Bootstrap→蒙特卡洛
└── 模块五：进阶数学（9天）         KL散度→贝叶斯→马尔可夫→凸优化→正则化→维度诅咒
```

---

## 本地运行

直接用浏览器打开 `main/index.html`，或使用任意静态服务器：

```bash
cd main && python -m http.server 8080
# 访问 http://localhost:8080
```

无构建步骤，无依赖。新用户从 `#overview` 进入，旧版用户打开后自动继承 localStorage 中的学习进度。
