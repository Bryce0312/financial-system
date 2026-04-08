import { Module } from "@nestjs/common";

import { AttachmentsModule } from "@/modules/attachments/attachments.module";

import { ExportsController } from "./exports.controller";
import { ExportsService } from "./exports.service";

@Module({
  imports: [AttachmentsModule],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService]
})
export class ExportsModule {}
