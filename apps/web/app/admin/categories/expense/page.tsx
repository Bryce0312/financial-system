"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { ExpenseExtensionType, RoleCode } from "@financial-system/types";

import {
  Badge,
  Button,
  ConfigActionBar,
  ConfigEditorCard,
  ConfigField,
  ConfigPageGrid,
  ConfigPageLayout,
  ConfigStatusCard,
  ConfigTableCard,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/admin-config-page";
import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";

type ExpenseCategory = {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  limitEnabled: boolean;
  invoiceRequired: boolean;
  extensionType: ExpenseExtensionType;
  sortOrder: number;
};

type CreateForm = {
  name: string;
  code: string;
  extensionType: ExpenseExtensionType;
  sortOrder: number;
};

type EditForm = {
  id: string;
  name: string;
  sortOrder: number;
  enabled: boolean;
  limitEnabled: boolean;
  invoiceRequired: boolean;
};

export default function ExpenseCategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);

  const createForm = useForm<CreateForm>({
    defaultValues: {
      name: "",
      code: "",
      extensionType: ExpenseExtensionType.NONE,
      sortOrder: 0
    }
  });

  const editForm = useForm<EditForm>({
    defaultValues: {
      id: "",
      name: "",
      sortOrder: 0,
      enabled: true,
      limitEnabled: false,
      invoiceRequired: false
    }
  });

  const list = useQuery({
    queryKey: ["admin-expense-categories"],
    queryFn: () => apiFetch<ExpenseCategory[]>("/expense-categories")
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateForm) =>
      apiFetch("/expense-categories", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          enabled: true,
          limitEnabled: false,
          invoiceRequired: false,
          sortOrder: Number(values.sortOrder)
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expense-categories"] });
      createForm.reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (values: EditForm) =>
      apiFetch(`/expense-categories/${values.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name,
          sortOrder: Number(values.sortOrder),
          enabled: values.enabled,
          limitEnabled: values.limitEnabled,
          invoiceRequired: values.invoiceRequired
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expense-categories"] });
      setEditing(null);
    }
  });

  const items = list.data || [];
  const stats = useMemo(() => {
    const enabledCount = items.filter((item) => item.enabled).length;
    const disabledCount = items.length - enabledCount;
    return [
      { label: "总数", value: items.length },
      { label: "启用", value: enabledCount },
      { label: "停用", value: disabledCount }
    ];
  }, [items]);

  const resetCreate = () => {
    setEditing(null);
    createForm.reset({
      name: "",
      code: "",
      extensionType: ExpenseExtensionType.NONE,
      sortOrder: 0
    });
  };

  const startEdit = (item: ExpenseCategory) => {
    setEditing(item);
    editForm.reset({
      id: item.id,
      name: item.name,
      sortOrder: item.sortOrder,
      enabled: item.enabled,
      limitEnabled: item.limitEnabled,
      invoiceRequired: item.invoiceRequired
    });
  };

  const panelTitle = editing ? `编辑 ${editing.name}` : "新增报销分类";

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <ConfigPageLayout
        title="报销分类"
        description="维护员工端可见的报销类别。编码和扩展类型保持锁定，避免影响表单结构和历史数据解释。"
        actions={
          <Button variant="secondary" onClick={resetCreate}>
            新建分类
          </Button>
        }
      >
        <ConfigPageGrid>
          <ConfigTableCard title="分类清单" description="编辑名称、排序、发票与限额开关，停用后仅对后续新建报销隐藏。" stats={stats}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>名称</TableHeader>
                  <TableHeader>编码</TableHeader>
                  <TableHeader>扩展类型</TableHeader>
                  <TableHeader>发票</TableHeader>
                  <TableHeader>限额</TableHeader>
                  <TableHeader>状态</TableHeader>
                  <TableHeader>操作</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="align-middle">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-400">排序 {item.sortOrder}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{item.code}</TableCell>
                    <TableCell>{item.extensionType}</TableCell>
                    <TableCell>
                      <Badge variant={item.invoiceRequired ? "warning" : "muted"}>{item.invoiceRequired ? "必传" : "非必传"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.limitEnabled ? "default" : "muted"}>{item.limitEnabled ? "启用" : "关闭"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.enabled ? "success" : "warning"}>{item.enabled ? "启用中" : "已停用"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="outline" className="admin-config-rowButton" onClick={() => startEdit(item)}>
                        编辑
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ConfigTableCard>

          <ConfigEditorCard
            eyebrow={editing ? "Edit expense category" : "Create expense category"}
            title={panelTitle}
            description={editing ? "仅开放低风险字段。停用不会删除历史报销，也不会改变旧记录。" : "新增时设置分类编码和扩展类型，保存后再通过编辑面板管理启停。"}
          >
            {editing ? (
              <form className="space-y-5" onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}>
                <ConfigField label="分类名称">
                  <Input placeholder="例如：加班餐 / 办公用品" {...editForm.register("name")} />
                </ConfigField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ConfigField label="分类编码" hint="锁定">
                    <Input value={editing.code} disabled className="cursor-not-allowed bg-slate-50 text-slate-400" />
                  </ConfigField>
                  <ConfigField label="扩展类型" hint="锁定">
                    <Input value={editing.extensionType} disabled className="cursor-not-allowed bg-slate-50 text-slate-400" />
                  </ConfigField>
                </div>

                <ConfigField label="排序">
                  <Input type="number" placeholder="数字越小越靠前" {...editForm.register("sortOrder", { valueAsNumber: true })} />
                </ConfigField>

                <ConfigStatusCard
                  title="分类启停"
                  description="停用后员工端新建报销将不再展示该分类，历史报销仍保留关联。"
                  activeLabel="启用中"
                  inactiveLabel="已停用"
                  enabled={editForm.watch("enabled")}
                  onToggle={() => editForm.setValue("enabled", !editForm.getValues("enabled"))}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <ConfigStatusCard
                    title="发票要求"
                    description="开启后，该分类提交时会写入必传发票快照并参与异常标记。"
                    activeLabel="必传"
                    inactiveLabel="非必传"
                    enabled={editForm.watch("invoiceRequired")}
                    onToggle={() => editForm.setValue("invoiceRequired", !editForm.getValues("invoiceRequired"))}
                  />
                  <ConfigStatusCard
                    title="限额规则"
                    description="开启后分类可关联限额规则，系统会继续做超额标记。"
                    activeLabel="启用"
                    inactiveLabel="关闭"
                    enabled={editForm.watch("limitEnabled")}
                    onToggle={() => editForm.setValue("limitEnabled", !editForm.getValues("limitEnabled"))}
                  />
                </div>

                <ConfigActionBar onCancel={() => setEditing(null)} submitLabel="保存修改" isSubmitting={updateMutation.isPending} />
                {updateMutation.error ? <p className="text-sm text-rose-600">{updateMutation.error.message}</p> : null}
              </form>
            ) : (
              <form className="space-y-5" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
                <ConfigField label="分类名称">
                  <Input placeholder="例如：市内交通 / 办公用品" {...createForm.register("name")} />
                </ConfigField>
                <ConfigField label="分类编码" hint="创建后锁定">
                  <Input placeholder="例如：TAXI / OFFICE" {...createForm.register("code")} />
                </ConfigField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ConfigField label="扩展类型" hint="决定员工端表单结构">
                    <Select {...createForm.register("extensionType")}>
                      <option value={ExpenseExtensionType.NONE}>普通</option>
                      <option value={ExpenseExtensionType.TRAVEL}>差旅</option>
                      <option value={ExpenseExtensionType.PURCHASE}>采购</option>
                    </Select>
                  </ConfigField>
                  <ConfigField label="排序">
                    <Input type="number" placeholder="默认 0" {...createForm.register("sortOrder", { valueAsNumber: true })} />
                  </ConfigField>
                </div>
                <ConfigActionBar onCancel={resetCreate} cancelLabel="清空" submitLabel="创建分类" isSubmitting={createMutation.isPending} />
                {createMutation.error ? <p className="text-sm text-rose-600">{createMutation.error.message}</p> : null}
              </form>
            )}
          </ConfigEditorCard>
        </ConfigPageGrid>
      </ConfigPageLayout>
    </AppShell>
  );
}


