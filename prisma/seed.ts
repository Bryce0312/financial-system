import "dotenv/config";

import bcrypt from "bcryptjs";
import { ExpenseExtensionType, PrismaClient, RoleCode } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const employeeRole = await prisma.role.upsert({
    where: { code: RoleCode.EMPLOYEE },
    update: { name: "Employee" },
    create: { code: RoleCode.EMPLOYEE, name: "Employee" }
  });

  const adminRole = await prisma.role.upsert({
    where: { code: RoleCode.ADMIN },
    update: { name: "Admin" },
    create: { code: RoleCode.ADMIN, name: "Admin" }
  });

  const categories = [
    { name: "Team Meal", code: "TEAM_MEAL", limitEnabled: false, invoiceRequired: true, extensionType: ExpenseExtensionType.NONE, sortOrder: 1 },
    { name: "Overtime Meal", code: "OVERTIME_MEAL", limitEnabled: true, invoiceRequired: true, extensionType: ExpenseExtensionType.NONE, sortOrder: 2 },
    { name: "Office", code: "OFFICE", limitEnabled: false, invoiceRequired: true, extensionType: ExpenseExtensionType.NONE, sortOrder: 3 },
    { name: "Travel", code: "TRAVEL", limitEnabled: true, invoiceRequired: true, extensionType: ExpenseExtensionType.TRAVEL, sortOrder: 4 },
    { name: "Taxi", code: "TAXI", limitEnabled: false, invoiceRequired: true, extensionType: ExpenseExtensionType.NONE, sortOrder: 5 },
    { name: "Overtime Taxi", code: "OVERTIME_TAXI", limitEnabled: false, invoiceRequired: true, extensionType: ExpenseExtensionType.NONE, sortOrder: 6 },
    { name: "Purchase", code: "PURCHASE", limitEnabled: false, invoiceRequired: true, extensionType: ExpenseExtensionType.PURCHASE, sortOrder: 7 }
  ];

  for (const category of categories) {
    await prisma.expenseCategory.upsert({ where: { code: category.code }, update: category, create: category });
  }

  const purchaseCategories = [
    { name: "Office Supplies", code: "OFFICE_SUPPLIES", sortOrder: 1 },
    { name: "Office Equipment", code: "OFFICE_EQUIPMENT", sortOrder: 2 },
    { name: "Office Environment", code: "OFFICE_ENVIRONMENT", sortOrder: 3 },
    { name: "Software Service", code: "SOFTWARE_SERVICE", sortOrder: 4 },
    { name: "Logistics", code: "LOGISTICS", sortOrder: 5 },
    { name: "Brand", code: "BRAND", sortOrder: 6 },
    { name: "Hiring", code: "HIRING", sortOrder: 7 }
  ];

  for (const category of purchaseCategories) {
    await prisma.purchaseCategory.upsert({ where: { code: category.code }, update: category, create: category });
  }

  const overtimeMeal = await prisma.expenseCategory.findUniqueOrThrow({ where: { code: "OVERTIME_MEAL" } });
  const travel = await prisma.expenseCategory.findUniqueOrThrow({ where: { code: "TRAVEL" } });

  await prisma.limitRule.upsert({
    where: { id: "00000000-0000-0000-0000-000000000030" },
    update: {
      name: "Overtime Meal Limit",
      expenseCategoryId: overtimeMeal.id,
      enabled: true,
      limitAmount: 30,
      effectiveAt: new Date("2026-01-01T00:00:00.000Z"),
      description: "Default overtime meal limit"
    },
    create: {
      id: "00000000-0000-0000-0000-000000000030",
      name: "Overtime Meal Limit",
      expenseCategoryId: overtimeMeal.id,
      enabled: true,
      limitAmount: 30,
      effectiveAt: new Date("2026-01-01T00:00:00.000Z"),
      description: "Default overtime meal limit"
    }
  });

  await prisma.limitRule.upsert({
    where: { id: "00000000-0000-0000-0000-000000000600" },
    update: {
      name: "Travel Limit",
      expenseCategoryId: travel.id,
      enabled: true,
      limitAmount: 600,
      effectiveAt: new Date("2026-01-01T00:00:00.000Z"),
      description: "Default travel limit"
    },
    create: {
      id: "00000000-0000-0000-0000-000000000600",
      name: "Travel Limit",
      expenseCategoryId: travel.id,
      enabled: true,
      limitAmount: 600,
      effectiveAt: new Date("2026-01-01T00:00:00.000Z"),
      description: "Default travel limit"
    }
  });

  const adminPassword = await bcrypt.hash("Admin1234", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { realName: "System Admin", passwordHash: adminPassword, email: "admin@example.com" },
    create: { username: "admin", passwordHash: adminPassword, realName: "System Admin", email: "admin@example.com" }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id }
  });

  const employeePassword = await bcrypt.hash("Employee1234", 10);
  const employee = await prisma.user.upsert({
    where: { username: "employee" },
    update: { realName: "Demo Employee", passwordHash: employeePassword, email: "employee@example.com" },
    create: { username: "employee", passwordHash: employeePassword, realName: "Demo Employee", email: "employee@example.com" }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: employee.id, roleId: employeeRole.id } },
    update: {},
    create: { userId: employee.id, roleId: employeeRole.id }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });