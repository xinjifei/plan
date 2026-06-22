# 学习计划追踪器 — UI 重设计方案

三个简约风格方案，均**只修改 HTML 结构 + CSS + UI 渲染 JS，不动任何学习数据内容**。

---

## 方案速览

| | [A：Developer Dark](方案A-Developer-Dark.md) | [B：Warm Card](方案B-Warm-Card.md) | [C：Dashboard](方案C-Dashboard.md) |
|---|---|---|---|
| **设计语言** | 终端/IDE 风格 | 温暖卡片/杂志风格 | 数据仪表盘风格 |
| **灵感** | VS Code · GitHub · Linear | Notion · Apple Notes · Headspace | Strava · Apple Health · 量化终端 |
| **主色调** | 冷黑灰 + 蓝绿 | 暖白/米色 + 琥珀 | 深蓝黑 + 青绿 + 金 |
| **导航方式** | 左侧树形 Sidebar | 横向卡片列表 | 顶部 KPI + 底部列表 |
| **阶段展示** | 折叠树节点 | 大卡片 grid | 横向时间轴 + 进度条 |
| **进度表达** | 2px 细条 + 等宽数字 | 圆形 SVG 进度环 | 渐变进度条 + KPI 卡片 |
| **日格子** | 正方形 16×16 | 迷你圆角方块 10×10 | 热力图 12×12 |
| **详情页特色** | Prompt 代码块 + checkbox | 任务先行 + Prompt 可折叠 | 大进度条 + 底部时间线 |
| **配色数量** | 12 个 CSS 变量 | 12 个 CSS 变量 | 12 个 CSS 变量 |

---

## 文件结构

```
style_demo/
├── README.md                   ← 你在这里
├── 方案A-Developer-Dark.md      ← 终端/IDE 风格详细说明
├── 方案B-Warm-Card.md           ← 温暖卡片风格详细说明
└── 方案C-Dashboard.md           ← 数据仪表盘风格详细说明
```

---

## 三个方案共同保证

- ✅ `MAIN_PLAN` / `MATH_TRACK` 数据不变
- ✅ 所有 Day 的 `prompt`、`tasks`、`description` 不变
- ✅ `Store`（localStorage 读写）不变
- ✅ `Router`（hash 路由）不变
- ✅ 连胜逻辑（刚修好的 `getStreak`）不变
- ✅ 阶段折叠/展开行为不变
- ✅ 只改：HTML 元素结构、CSS 样式、`renderHome` / `renderDay` / `updateTopbar` / `updateStats` 函数
