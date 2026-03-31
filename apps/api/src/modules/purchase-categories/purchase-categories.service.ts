import { Injectable, NotFoundException } from "@nestjs/common";

import { PurchaseCategoryInput } from "@financial-system/types";

import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class PurchaseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.purchaseCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  }

  create(input: PurchaseCategoryInput) {
    return this.prisma.purchaseCategory.create({ data: input });
  }

  async update(id: string, input: Partial<PurchaseCategoryInput>) {
    const existing = await this.prisma.purchaseCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("采购分类不存在");
    }
    return this.prisma.purchaseCategory.update({ where: { id }, data: input });
  }
}

