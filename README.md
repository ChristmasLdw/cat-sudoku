# 猫猫数独 Cat Sudoku

[在线游戏](https://christmasldw.com/cat-sudoku/) · [独立仓库](https://github.com/ChristmasLdw/cat-sudoku)

原创猫咪 SVG 与界面，196 个棋盘（含用户截图还原的 7 个测试棋盘）。关卡编号、顺序、颜色区域均保持此次恢复的线上版本不变。网站首页由 christmasldw-homepage 仓库单独维护。

## 本地运行

前端没有构建依赖。在仓库目录运行 `python -m http.server 8765`，访问 http://127.0.0.1:8765/ 。也可运行 `node build-single.cjs`，得到可直接打开、离线游玩的 `dist/cat-sudoku.html`。离线版不提供账号和在线排行榜。

部署前端需要 index.html、styles.css、engine.js、trial.js、levels.js、hints.js、tutorial.js、journey.js、results.js、app.js 十个文件。更新源码后请重新生成单文件。

## 操作与保存

- 每行、每列、每种颜色恰好一只猫，八邻格不能有另一只猫。
- 单击标 ×，双击放猫；按住拖动批量标 ×，从 × 开始拖动可擦除。键盘 C 放猫，X 标记，Delete 清空。
- 撤销、假设、提示、技巧保持固定位置和固定含义。假设浮层提供撤回、撤回并排除、保留；它不挤动棋盘。
- **未完成的棋盘不保存，刷新后从本关初始状态重新开始。** 当前页内返回首页再进入仍可接着玩。
- 保存通关记录、个人最佳、练习过的技巧和偏好。仅查看提示记为“见过”，实际完成指导操作才记为“练习过”，不声称已经掌握。
- 在线账号的记录跨设备合并。未确认的设置和完成提交会在本机排队，联网后重试；只有完成结果存入队列，没有未完成盘面。

## 榜单口径

总榜按首次通关的关卡数；日榜按北京时间当天，周榜按北京时间周一 00:00 至下一周一 00:00。重复玩同一关不增加这些分数。同分并列。

历史累计通关保留。旧版每日快照中，可核对的累计通关增量会补入该快照日期的日榜、周榜，并标注来源；快照缺日时以实际记录日期为准。首张快照因没有此前基线，不将累计数全部当成当天成绩；计数回退后恢复也不会重复计入。恢复过程不虚构逐关日期或用时，不改变总榜和既有用时。新成绩仍按首次验证的逐关记录统计，离线排队成绩在服务器收到并验证时计入当期。

每关用时榜按每人同模式最佳用时排序：独立完成与借助提示/棋盘教学分开；同用时并列，并显示正式放猫造成的规则冲突次数。假设中的试错不计入冲突。当前无其他成绩时显示空榜，不伪造玩家、百分位或用时。

计时从进入棋盘开始，离开游戏页、切换浏览器标签、暂停或打开设置等对话框时停止。记录精度为 0.1 秒。排行榜与个人最佳都保留各模式最快成绩；成绩按账号隔离。

服务器验证关卡 ID、每行每列每颜色一猫、相邻限制、固定线索，并对完成请求做幂等处理。**计时、提示数、冲突数仍来自浏览器，这不是防作弊竞赛系统**；有奖赛事需要进一步采用服务器计时凭证和操作回放验证。

## 账号与 API 部署

在线功能需要 Node.js 20+ 与 PostgreSQL；静态游玩不需要后端。`api/` 内是恢复后纳入版本管理的服务源码，只有 pg 依赖。

1. `npm ci --prefix api --ignore-scripts`。
2. 在服务器配置 DATABASE_URL、LANTECHO_CLIENT_ID、LANTECHO_CLIENT_SECRET、PUBLIC_ORIGIN、BASE_PATH 等环境变量；凭据不要提交 Git。默认绑定 127.0.0.1:3020。
3. 备份数据库和静态目录后，上传 api/server.js、scoring.cjs、catalog.json、providers/ 及 package 文件，保留服务器已有环境配置。
4. 在 api 目录使用已有进程管理器启动 `node --env-file=.env server.js`。启动会执行兼容旧数据的增量建表；以 server.js 的 initSchema 为准。
5. 反向代理 `/cat-sudoku/api/` 至 `http://127.0.0.1:3020/`，剥掉此前缀；静态文件部署至 `/cat-sudoku/`。
6. 验证 `/cat-sudoku/api/health`、总榜、日榜、周榜和单关榜后再结束发布。

本次增量表为 completions（首次通关）、attempts（已验证的完成记录）、scoring_meta（统计启用时间）、legacy_period_credits（旧版快照增量及其原始依据），以及 progress.skills。原账号和进度表继续使用。api/catalog.json 只含关卡规则与固定线索，不含答案。

## 验证

运行 `node` 加以下测试文件：tests.cjs、tests-trial.cjs、tests-hints.cjs、tests-visual-hints.cjs、tests-coach.cjs、tests-journey.cjs、tests-screenshots.cjs、tests-expansion.cjs、tests-scoring.cjs、tests-sync.cjs。

196 关由独立全排列验证唯一解；提示/教学检查合法性和操作完成条件；新增测试覆盖北京时间日/周边界、个人最佳、榜单请求竞态、并发同步和失败重试。

数据库集成测试：给 `api/tests-integration.cjs` 提供 DATABASE_URL 后执行。测试自动建立随机独立 schema，并在 finally 中删除自己的 schema；数据库角色需具备建 schema 权限。覆盖历史迁移、并发合并、重复请求、非法棋盘、单关最佳及并列排名，不写生产业务表。

浏览器验证以 Chromium 的手机视口为主；实体手机振动与各设备音效仍需实际体验。
