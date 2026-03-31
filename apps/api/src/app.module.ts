import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { StorageModule } from "./common/storage/storage.module";
import { AnomaliesModule } from "./modules/anomalies/anomalies.module";
import { AttachmentsModule } from "./modules/attachments/attachments.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ExpenseCategoriesModule } from "./modules/expense-categories/expense-categories.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { ExportsModule } from "./modules/exports/exports.module";
import { PurchaseCategoriesModule } from "./modules/purchase-categories/purchase-categories.module";
import { RulesModule } from "./modules/rules/rules.module";
import { StatsModule } from "./modules/stats/stats.module";
import { UsersModule } from "./modules/users/users.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    ExpenseCategoriesModule,
    PurchaseCategoriesModule,
    RulesModule,
    AttachmentsModule,
    ExpensesModule,
    AnomaliesModule,
    StatsModule,
    ExportsModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}

