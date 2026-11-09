# 验证
`browser-check.mjs` 是本地开发检查脚本，使用 design-taste-frontend 技能提供的 CDP 客户端；运行 Demo 无需它。
启动 Demo 后运行 `node qa/browser-check.mjs`。如技能安装位置不同，修改首行 import。
结果与截图写入 `.impeccable/review/`。浏览器使用临时 profile，不修改用户的浏览器记录。
