# Change Log

## 2026-04-07

### 管理端配置项：支持编辑与停用

- 覆盖页面：报销分类、采购分类、规则管理。
- 行为变更：新增行级编辑入口，新增状态展示（`启用中` / `已停用`）。
- 停用策略：通过 `enabled=false` 停用，不做物理删除。
- 历史数据边界：不回写、不重算、不迁移，统计和导出保持原有历史记录。

#### 字段开放范围

- 报销分类：`name`、`sortOrder`、`invoiceRequired`、`limitEnabled`、`enabled`
- 采购分类：`name`、`sortOrder`、`enabled`
- 规则管理：`name`、`description`、`limitAmount`、`effectiveAt`、`enabled`

#### 字段锁定范围

- 报销分类：`code`、`extensionType`
- 采购分类：`code`
- 规则：关联分类字段（`expenseCategoryId`）在编辑态锁定

### 员工端新建报销：隐藏停用项

- 新建报销页的报销分类和采购分类只展示 `enabled=true` 项。
- 管理端仍可查看停用项，便于维护和审计。

### Excel 导出：新增发票预览

- 在“报销明细”sheet 新增一列：`发票预览`。
- 图片发票：直接嵌入表内预览图。
- PDF 发票：逐页转 PNG 后嵌入，同一报销记录按页纵向展开。
- 预览图点击：跳转系统后端稳定地址（`/attachments/public/:id?token=...`）。
- 不新增 `发票文件数`、`发票说明` 字段。

### 降级与稳定性

- PDF 转图失败时，不中断整份导出任务；该附件降级为可点击文本链接。
- 预览链接不直接暴露存储层地址（MinIO/本地文件路径）。

### 环境依赖（PDF 转图）

- 需要 Python 3 可执行命令（`python` 或 `py -3`）。
- 需要安装 `pymupdf`：

```bash
pip install pymupdf
```

- 转图脚本位置：`apps/api/scripts/pdf_to_png.py`

## 2026-04-08

### 管理端配置页：编辑与停用 UI 重做

- 报销分类、采购分类、规则管理三页统一为“列表 + 右侧编辑面板”布局。
- 编辑态补充状态卡片与启停开关，不再使用简单复选框堆叠。
- 锁定字段继续保留只读展示，避免误改 code、extensionType、规则关联分类。

### Excel 发票预览：版式收敛与 PDF 转图兜底

- 报销明细 sheet 的 发票预览 列改为固定可读尺寸，不再追求铺满单元格。
- 预览图区增加留白，优先保证整张表的可读性。
- PDF 转图执行链新增 conda run -n financial-system python 兜底，再回退到 python / py -3。
- 单页转换失败仍按文本链接降级，不阻断整份导出。

### 本地运行验证

- 
pm run build 已通过。
- 本地服务验证时，Web 改为基于已构建产物启动，避免 
ext dev 在 Windows 下出现 .next 清理后的 manifest 抖动问题。
