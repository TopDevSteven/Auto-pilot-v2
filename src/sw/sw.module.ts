import { Module } from '@nestjs/common';
import { SwService } from './sw.service';

@Module({
  providers: [SwService],
  exports: [SwService]
})
export class SwModule {}
