# 双轨学习计划设计系统

<!-- impeccable:design-schema 1 -->

## Surface

Operate 模式的个人学习工具。界面先呈现下一项可执行学习任务，再展示完成状态和课程结构。

## Direction

True-black flat，来自 `design-taste-frontend` 的 `true-black-flat` 方向（seed `680993631`，保留既有 Geist 排版）。全黑工作底面、深灰内容层级、反白主操作和低比例荧光黄绿数据标记。产品识别来自“双轨”符号、并列进度和跨轨关联，而不是营销型图形。

## Tokens

- Ground `#000000`；surface `#111111`；raised `#2a2a2a`
- Ink `#ffffff`；muted `#b4b4b4`；rule `#161616`
- Primary `#ffffff`；progress/current `#c6f24e`
- Positive `#c6f24e`；error `#ff7278`
- Card radius 8px；control radius 6px；主间距 24px
- Geist 用于拉丁文字及数字，中文交给苹方或微软雅黑等系统无衬线字体。

## Layout and behavior

- 桌面：232px 侧栏；首页使用 7:5 任务/进度列；学习日使用阅读区与 340px 任务栏。
- 平板：侧栏折叠为顶部导航；首页保持两个主要信息区。
- 手机：任务区排在长 Prompt 前；阶段改为横向导航，目录改为单列课程清单。
- 已完成、学习中、未开始不只使用颜色，均带图标与文本。
- 所有学习统计由 `js/data.js` 和本地学习记录计算，不维护重复指标。

## Component vocabulary

- 反白实心按钮仅用于本屏主动作；深灰边框按钮用于次级操作。
- 目录行、任务行和阶段格子是可操作的真实链接或表单控件。
- “课程目录”是侧栏入口，打开独立的大纲界面。大纲借用学习计划本身的树形语言：两条轨道为根，阶段、小节、学习日逐层展开；细连线说明层级，编号节点、学习日范围、完成数和当前分支承担定位信息。它不是卡片清单；点击阶段会在列表目录中定位到同一阶段。
- 任务完成与学习日完成分开：必须勾完任务才能启用完成按钮；取消任务会撤销当天完成。
- 长 Prompt 使用原生 `details`，复制和关联跳转不遮挡任务操作。

## Accessibility

跳过链接不改变 SPA 路由；焦点可见；所有图标按钮有 accessible name；弹窗使用原生 `dialog`；状态用文字、图标和颜色共同传达。减少动态效果偏好时关闭过渡。
