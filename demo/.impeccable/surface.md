# Demo surface brief
Mode: Operate. User delegated design decisions. Code-led app screen.
## Direction contract
THESIS: 把课程学习日与数学依据连成一条可执行学习路径，首先回答接下来做什么。
OWN-WORLD: True-black flat，全黑基底与深灰层级，反白主控件，黄绿只用于进度、当前学习日和正向完成状态；Geist 数字和中文系统无衬线字体；低干扰侧栏，正文与任务两列。
STORY: 首页继续学习；任务列表核对产出；相关数学独立打开且保留返回主计划的链接；课程目录定位任意学习日。
FIRST VIEWPORT: 232px 侧栏；右侧流式内容。首页主任务占 7/12，进度占 5/12，下方阶段路径、近期完成。详情任务栏占 4/12，手机移至正文之前。
FORM: 学习清单与课程目录。Taste seed 680993631; seed: none (unavailable — Impeccable executable/engine unavailable). 用户明确授权自主选择，不增加设计确认流程。True-black flat 的 T-frame 被移动端折叠顶栏翻译；首页仍由任务而非统计卡主导。既有自托管 Geist 保留，避免改变中文与离线字体覆盖。
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
## Data inventory
- 两个轨道，分别 96 / 42 个学习日；数据是独立模拟，不是正式课程。
- 主计划四阶段，每阶段两小节；数学三阶段，每阶段两小节。
- 每日有稳定 ID、标题、阶段、小节、建议分钟、目标、概念、Prompt 与任务。
- 主计划第78天关联数学第34天，关系双向可追溯。
- 默认完成主计划77天、数学33天，主78已勾选1/4任务。
- 日期固定2026-10-29。连续天数按有完成记录的自然日计算。
- 比率、阶段数、状态和近期记录全部从相同记录推导。
- 首页首问“现在学什么”；目录首问“目标内容在哪里”；详情首问“今天做什么，做完了吗”。
- 失败、未开始、已完成、空搜索均有反馈；本地存储不可用时保留内存并明确提示。
