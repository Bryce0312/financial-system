"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { RoleCode } from "@financial-system/types";

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
  TableRow,
  Textarea
} from "@/components/admin-config-page";
import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";

type ExpenseCategory = { id: string; name: string };

type RuleItem = {
  id: string;
  name: string;
  expenseCategoryId: string;
  expenseCategory: { name: string };
  enabled: boolean;
  limitAmount: number;
  effectiveAt: string;
  description?: string | null;
};

type CreateForm = {
  name: string;
  expenseCategoryId: string;
  limitAmount: number;
  effectiveAt: string;
  description: string;
};

type EditForm = {
  id: string;
  name: string;
  limitAmount: number;
  effectiveAt: string;
  description: string;
  enabled: boolean;
};

const toInputDateTime = (value: string) => {
  if (!value) {
    return new Date().toISOString().slice(0, 16);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 16);
  }
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export default function RulesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<RuleItem | null>(null);

  const categories = useQuery({
    queryKey: ["rule-categories"],
    queryFn: () => apiFetch<ExpenseCategory[]>("/expense-categories")
  });

  const list = useQuery({
    queryKey: ["rules"],
    queryFn: () => apiFetch<RuleItem[]>("/rules")
  });

  const createForm = useForm<CreateForm>({
    defaultValues: {
      name: "",
      expenseCategoryId: "",
      limitAmount: 0,
      effectiveAt: new Date().toISOString().slice(0, 16),
      description: ""
    }
  });

  const editForm = useForm<EditForm>({
    defaultValues: {
      id: "",
      name: "",
      limitAmount: 0,
      effectiveAt: new Date().toISOString().slice(0, 16),
      description: "",
      enabled: true
    }
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateForm) =>
      apiFetch("/rules", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          enabled: true,
          limitAmount: Number(values.limitAmount),
          effectiveAt: new Date(values.effectiveAt).toISOString()
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      createForm.reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (values: EditForm) =>
      apiFetch(`/rules/${values.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name,
          enabled: values.enabled,
          limitAmount: Number(values.limitAmount),
          description: values.description,
          effectiveAt: new Date(values.effectiveAt).toISOString()
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      setEditing(null);
    }
  });

  const items = list.data || [];
  const stats = useMemo(() => {
    const enabledCount = items.filter((item) => item.enabled).length;
    return [
      { label: "总数", value: items.length },
      { label: "启用", value: enabledCount },
      { label: "停用", value: items.length - enabledCount }
    ];
  }, [items]);

  const resetCreate = () => {
    setEditing(null);
    createForm.reset({
      name: "",
      expenseCategoryId: "",
      limitAmount: 0,
      effectiveAt: new Date().toISOString().slice(0, 16),
      description: ""
    });
  };

  const startEdit = (item: RuleItem) => {
    setEditing(item);
    editForm.reset({
      id: item.id,
      name: item.name,
      limitAmount: Number(item.limitAmount),
      effectiveAt: toInputDateTime(item.effectiveAt),
      description: item.description || "",
      enabled: item.enabled
    });
  };

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <ConfigPageLayout
        title="规则管理"
        description="这里只管理后续新提交报销的规则命中方式。停用不会追溯修改历史异常，也不会影响既有导出结果。"
        actions={
          <Button variant="secondary" onClick={resetCreate}>
            新建规则
          </Button>
        }
      >
        <ConfigPageGrid>
          <ConfigTableCard title="规则清单" description="规则关联分类在编辑态锁定，避免误改后影响表单类型匹配和历史解释。" stats={stats}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>规则名称</TableHeader>
                  <TableHeader>分类</TableHeader>
                  <TableHeader>限额</TableHeader>
                  <TableHeader>生效时间</TableHeader>
                  <TableHeader>状态</TableHeader>
                  <TableHeader>操作</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.description || "暂无规则说明"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.expenseCategory.name}</TableCell>
                    <TableCell>￥{Number(item.limitAmount).toLocaleString()}</TableCell>
                    <TableCell>{String(item.effectiveAt).slice(0, 10)}</TableCell>
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
            eyebrow={editing ? "Edit rule" : "Create rule"}
            title={editing ? `编辑 ${editing.name}` : "新增规则"}
            description={editing ? "可调整名称、说明、限额、生效时间与启停。分类保持锁定。" : "新增规则后会参与后续新报销的异常标记，不会回算历史数据。"}
          >
            {editing ? (
              <form className="space-y-5" onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}>
                <ConfigField label="规则名称">
                  <Input placeholder="例如：加班餐限额" {...editForm.register("name")} />
                </ConfigField>
                <ConfigField label="关联分类" hint="锁定">
                  <Input value={editing.expenseCategory.name} disabled className="cursor-not-allowed bg-slate-50 text-slate-400" />
                </ConfigField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ConfigField label="限额金额">
                    <Input type="number" step="0.01" placeholder="例如 50" {...editForm.register("limitAmount", { valueAsNumber: true })} />
                  </ConfigField>
                  <ConfigField label="生效时间">
                    <Input type="datetime-local" {...editForm.register("effectiveAt")} />
                  </ConfigField>
                </div>
                <ConfigField label="规则说明">
                  <Textarea placeholder="说明这个规则面向什么场景、为什么设这个限额。" {...editForm.register("description")} />
                </ConfigField>
                <ConfigStatusCard
                  title="规则启停"
                  description="停用后不再参与后续新报销的判断，但旧异常记录不会重算。"
                  activeLabel="启用中"
                  inactiveLabel="已停用"
                  enabled={editForm.watch("enabled")}
                  onToggle={() => editForm.setValue("enabled", !editForm.getValues("enabled"))}
                />
                <ConfigActionBar onCancel={() => setEditing(null)} submitLabel="保存修改" isSubmitting={updateMutation.isPending} />
                {updateMutation.error ? <p className="text-sm text-rose-600">{updateMutation.error.message}</p> : null}
              </form>
            ) : (
              <form className="space-y-5" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
                <ConfigField label="规则名称">
                  <Input placeholder="例如：加班餐限额" {...createForm.register("name")} />
                </ConfigField>
                <ConfigField label="关联报销分类">
                  <Select {...createForm.register("expenseCategoryId")}>
                    <option value="">选择报销分类</option>
                    {categories.data?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </ConfigField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ConfigField label="限额金额">
                    <Input type="number" step="0.01" placeholder="例如 50" {...createForm.register("limitAmount", { valueAsNumber: true })} />
                  </ConfigField>
                  <ConfigField label="生效时间">
                    <Input type="datetime-local" {...createForm.register("effectiveAt")} />
                  </ConfigField>
                </div>
                <ConfigField label="规则说明">
                  <Textarea placeholder="填写规则说明，便于后续管理员理解和维护。" {...createForm.register("description")} />
                </ConfigField>
                <ConfigActionBar onCancel={resetCreate} cancelLabel="清空" submitLabel="创建规则" isSubmitting={createMutation.isPending} />
                {createMutation.error ? <p className="text-sm text-rose-600">{createMutation.error.message}</p> : null}
              </form>
            )}
          </ConfigEditorCard>
        </ConfigPageGrid>
      </ConfigPageLayout>
    </AppShell>
  );
}


