import { Module } from '@nestjs/common';
import { BdayappendModule } from '../bdayappend/bdayappend.module';
import { MailinglistService } from './mailinglist.service';
import { MailinglistCountsService } from './mailinglist.counts.service';
import { MailinglistMaxListService } from './mailinglist.maxlists.service';
import { MailinglistSaveCSVService } from './mailinglist.savecsv.service';
import { MailinglistGenerateService } from './mailinglist.generate.service';
import { MailinglistReadPrevMonthService } from './mailinglist.readpremonth.service';

@Module({
  imports: [
    BdayappendModule
  ],
  providers: [
    MailinglistService,
    MailinglistCountsService,
    MailinglistMaxListService,
    MailinglistSaveCSVService,
    MailinglistGenerateService,
    MailinglistReadPrevMonthService
  ],
  exports: [
    MailinglistService,
    MailinglistCountsService,
    MailinglistMaxListService,
    MailinglistSaveCSVService,
    MailinglistGenerateService,
    MailinglistReadPrevMonthService
  ]
})
export class MailinglistModule {}
