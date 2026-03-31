import { Module } from "@nestjs/common";

import { AttachmentsModule } from "../attachments/attachments.module";
import { ExpenseCategoriesModule } from "../expense-categories/expense-categories.module";
import { RulesModule } from "../rules/rules.module";
import { ExpensesController } from "./expenses.controller";
import { ExpensesService } from "./expenses.service";

@Module({
  imports: [ExpenseCategoriesModule, RulesModule, AttachmentsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService]
})
export class ExpensesModule {}

