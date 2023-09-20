import { Module } from '@nestjs/common';
import { BdayappendService } from './bdayappend.service';
import { BdayAppendDistanceService } from './bdayappend.distance.service';

@Module({
  providers: [
    BdayappendService,
    BdayAppendDistanceService
  ],
  exports: [
    BdayappendService,
    BdayAppendDistanceService
  ]
})
export class BdayappendModule {}
