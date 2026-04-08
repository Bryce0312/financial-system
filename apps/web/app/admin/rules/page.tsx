"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { RoleCode } from "@financial-system/types";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

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
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>限额规则</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-6">
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
                {list.data?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.expenseCategory.name}</TableCell>
                    <TableCell>{item.limitAmount}</TableCell>
                    <TableCell>{String(item.effectiveAt).slice(0, 10)}</TableCell>
                    <TableCell>
                      <Badge variant={item.enabled ? "success" : "warning"}>{item.enabled ? "启用中" : "已停用"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="outline" onClick={() => startEdit(item)}>
                        编辑
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editing ? "编辑规则" : "新增规则"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {editing ? (
              <>
                <Input placeholder="规则名称" {...editForm.register("name")} />
                <Input type="number" step="0.01" placeholder="限额金额" {...editForm.register("limitAmount", { valueAsNumber: true })} />
                <Input type="datetime-local" {...editForm.register("effectiveAt")} />
                <Input placeholder="规则说明" {...editForm.register("description")} />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...editForm.register("enabled")} />启用</label>
                <p className="text-xs text-slate-500">规则关联分类在当前版本锁定，不支持在编辑态变更。</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={editForm.handleSubmit((values) => updateMutation.mutate(values))}
                    disabled={updateMutation.isPending}
                    style={{ backgroundColor: "#0f3d66", color: "#ffffff", minHeight: "44px" }}
                  >
                    {updateMutation.isPending ? "保存中..." : "确认保存"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                    取消
                  </Button>
                </div>
                {updateMutation.error ? <p className="text-sm text-rose-600">{updateMutation.error.message}</p> : null}
              </>
            ) : (
              <>
                <Input placeholder="规则名称" {...createForm.register("name")} />
                <Select {...createForm.register("expenseCategoryId")}>
                  <option value="">选择报销分类</option>
                  {categories.data?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                <Input type="number" step="0.01" placeholder="限额金额" {...createForm.register("limitAmount", { valueAsNumber: true })} />
                <Input type="datetime-local" {...createForm.register("effectiveAt")} />
                <Input placeholder="规则说明" {...createForm.register("description")} />
                <Button
                  type="button"
                  onClick={createForm.handleSubmit((values) => createMutation.mutate(values))}
                  disabled={createMutation.isPending}
                  style={{ backgroundColor: "#0f3d66", color: "#ffffff", minHeight: "44px" }}
                >
                  {createMutation.isPending ? "保存中..." : "确认新增"}
                </Button>
                {createMutation.error ? <p className="text-sm text-rose-600">{createMutation.error.message}</p> : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

