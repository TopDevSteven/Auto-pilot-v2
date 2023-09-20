import { Module } from '@nestjs/common';
import { TekService } from './tek.service';

@Module({
  providers: [TekService],
  exports: [TekService]
})
export class TekModule {}
