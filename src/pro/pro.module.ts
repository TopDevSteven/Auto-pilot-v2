import { Module } from '@nestjs/common';
import { ProService } from './pro.service';

@Module({
  providers: [ProService],
  exports: [ProService]
})
export class ProModule {}
