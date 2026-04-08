"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ExpenseExtensionType, RoleCode } from "@financial-system/types";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

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
  const [editing, setEditing] = useState<EditForm | null>(null);

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

  const startEdit = (item: ExpenseCategory) => {
    const next: EditForm = {
      id: item.id,
      name: item.name,
      sortOrder: item.sortOrder,
      enabled: item.enabled,
      limitEnabled: item.limitEnabled,
      invoiceRequired: item.invoiceRequired
    };
    setEditing(next);
    editForm.reset(next);
  };

  const isEditing = Boolean(editing);

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card>
          <CardHeader>
            <CardTitle>报销分类列表</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>名称</TableHeader>
                  <TableHeader>编码</TableHeader>
                  <TableHeader>扩展类型</TableHeader>
                  <TableHeader>排序</TableHeader>
                  <TableHeader>状态</TableHeader>
                  <TableHeader>操作</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.data?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.extensionType}</TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
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
            <CardTitle>{isEditing ? "编辑报销分类" : "新增报销分类"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isEditing ? (
              <>
                <Input placeholder="分类名称" {...editForm.register("name")} />
                <Input type="number" placeholder="排序" {...editForm.register("sortOrder", { valueAsNumber: true })} />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...editForm.register("enabled")} />启用</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...editForm.register("invoiceRequired")} />要求发票</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...editForm.register("limitEnabled")} />启用限额</label>
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
                <Input placeholder="分类名称" {...createForm.register("name")} />
                <Input placeholder="分类编码" {...createForm.register("code")} />
                <Select {...createForm.register("extensionType")}>
                  <option value={ExpenseExtensionType.NONE}>普通</option>
                  <option value={ExpenseExtensionType.TRAVEL}>差旅</option>
                  <option value={ExpenseExtensionType.PURCHASE}>采购</option>
                </Select>
                <Input type="number" placeholder="排序" {...createForm.register("sortOrder", { valueAsNumber: true })} />
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

