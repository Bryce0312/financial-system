### 5. 启动项目

建议统一使用仓库根目录脚本：

```powershell
.\start-local.ps1
```

该脚本会按“先关闭旧实例，再启动 PostgreSQL / API / Web”的顺序执行，避免端口残留、共享内存残留和脏进程导致的本地联调异常。

如需一键关闭本地服务，执行：

```powershell
.\stop-local.ps1
```

当前联调默认地址：
- Web: `http://127.0.0.1:3000`
- API: `http://localhost:3001`

项目级执行约束见 [`HARNESS.md`](./HARNESS.md)。

## 默认账号

种子数据默认包含：
- 管理员：`admin / Admin1234`
- 员工：`employee / Employee1234`

如果你改过 seed 或本地库，这两个账号可能已经变化。

## 开发说明

### 本地联调流程约定

- 进行代码修改前，先执行 `stop-local.ps1` 关闭本地 PostgreSQL / API / Web，避免旧进程和共享内存残留影响判断。
- 需要回归、联调、截图或人工验收时，再执行 `start-local.ps1` 干净启动整套本地服务。
- 遇到服务异常时，优先查看 `.logs` 目录和 `.local/postgres/postgres-runtime.err.log`。
- 改前端样式时，不要每次都动 PostgreSQL；只有涉及后端接口、数据库读写、登录状态或整链路验证时，再重启整套本地服务。
- 停服务一定走 `stop-local.ps1`，不要直接关终端、强关窗口或手动杀进程。
- `start-local.ps1` 启动失败时，先看 `.local/postgres/postgres-runtime.err.log`，先判断是 PostgreSQL 自动恢复还是实际损坏，再决定是否继续重启。

### 前端约束

- 业务页面集中在 `apps/web/app`
- 共享请求逻辑在 `apps/web/lib/api.ts`
- 主要业务表单在 `apps/web/components/expense-form.tsx`

### 后端约束
