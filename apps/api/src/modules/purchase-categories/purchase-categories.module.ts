import { Module } from "@nestjs/common";

import { PurchaseCategoriesController } from "./purchase-categories.controller";
import { PurchaseCategoriesService } from "./purchase-categories.service";

@Module({
  controllers: [PurchaseCategoriesController],
  providers: [PurchaseCategoriesService],
  exports: [PurchaseCategoriesService]
})
export class PurchaseCategoriesModule {}

