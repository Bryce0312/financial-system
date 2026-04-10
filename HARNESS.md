# Harness Rules

## Local Service Workflow

- 改前端样式时，不要每次都动 PostgreSQL；仅修改前端页面或样式时，优先复用现有前端服务。
- 只有涉及后端接口、数据库读写、种子数据、登录状态异常或整链路联调验证时，再重启整套本地服务。
- 停服务一定走 `stop-local.ps1`，不要直接关终端、强关窗口或手动杀 PostgreSQL 进程。
- 启动失败时，先查看 `.local/postgres/postgres-runtime.err.log`，先判断是“恢复中”还是“真的损坏”，不要立刻重复重启。

## Practical Rules

- 前端纯样式回归：优先只保留 Web 服务，不主动重启 PostgreSQL。
- 只有需要重新验证 API / DB 时，才执行 `start-local.ps1`。
- 如果 PostgreSQL 日志出现 `database system was interrupted`、`not properly shut down`、`automatic recovery in progress`，按恢复中处理，先等待恢复完成。
- 如果 PostgreSQL 日志持续报数据文件损坏、无法完成恢复或端口长期不可用，再按数据库异常单独排查。
