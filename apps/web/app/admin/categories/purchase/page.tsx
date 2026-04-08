"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { RoleCode } from "@financial-system/types";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";

type PurchaseCategory = {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  enabled: boolean;
};

type CreateForm = {
  name: string;
  code: string;
  sortOrder: number;
};

type EditForm = {
  id: string;
  name: string;
  sortOrder: number;
  enabled: boolean;
};

export default function PurchaseCategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EditForm | null>(null);

  const createForm = useForm<CreateForm>({ defaultValues: { name: "", code: "", sortOrder: 0 } });
  const editForm = useForm<EditForm>({ defaultValues: { id: "", name: "", sortOrder: 0, enabled: true } });

  const list = useQuery({
    queryKey: ["admin-purchase-categories"],
    queryFn: () => apiFetch<PurchaseCategory[]>("/purchase-categories")
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateForm) =>
      apiFetch("/purchase-categories", {
        method: "POST",
        body: JSON.stringify({ ...values, enabled: true, sortOrder: Number(values.sortOrder) })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-purchase-categories"] });
      createForm.reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (values: EditForm) =>
      apiFetch(`/purchase-categories/${values.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name,
          sortOrder: Number(values.sortOrder),
          enabled: values.enabled
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-purchase-categories"] });
      setEditing(null);
    }
  });

  const startEdit = (item: PurchaseCategory) => {
    const next: EditForm = {
      id: item.id,
      name: item.name,
      sortOrder: item.sortOrder,
      enabled: item.enabled
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
            <CardTitle>采购分类列表</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>名称</TableHeader>
                  <TableHeader>编码</TableHeader>
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
            <CardTitle>{isEditing ? "编辑采购分类" : "新增采购分类"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isEditing ? (
              <>
                <Input placeholder="分类名称" {...editForm.register("name")} />
                <Input type="number" placeholder="排序" {...editForm.register("sortOrder", { valueAsNumber: true })} />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...editForm.register("enabled")} />启用</label>
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

