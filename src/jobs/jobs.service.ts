import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import _, { countBy, result } from "lodash";

import { TekService } from "../tek/tek.service";
import { SwService } from "../sw/sw.service";
import { ProService } from "../pro/pro.service";
import { NapService } from "../nap/nap.service";
import { ListcleanupNameService } from "../listcleanup/listcleanup.name.service";
import { ListcleanupAddressService } from "../listcleanup/listcleanup.address.service";
import { ListcleanupDedupeService } from "../listcleanup/listcleanup.dedupe.service";
import { ListcleanupService } from "../listcleanup/listcleanup.service";
import { MitService } from "../mit/mit.service";
import { BdayappendService } from "../bdayappend/bdayappend.service";
import { MailinglistCountsService } from "../mailinglist/mailinglist.counts.service";
import { MailinglistMaxListService } from "../mailinglist/mailinglist.maxlists.service";
import { MailinglistSaveCSVService } from "../mailinglist/mailinglist.savecsv.service";
import { MailinglistGenerateService } from "../mailinglist/mailinglist.generate.service";

const allShops  = {
  tek: [
    // {
    //   wowShopId: 1057,
    //   shopName: 'Pitts Automotive',
    //   shopId: 4318,
    //   chainId: 0,
    //   software: 'Tek'
    // },
    // {
    //   wowShopId: 1055,
    //   shopName: "Ideal automative",
    //   shopId: 545,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1023,
    //   shopName: "Aero Auto Repair",
    //   shopId: 1159,
    //   chainId:101,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1024,
    //   shopName: "Aero Auto Repair",
    //   shopId: 1552,
    //   chainId:101,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1025,
    //   shopName: "Aero Auto Repair San Carlos",
    //   shopId: 3028,
    //   chainId:101,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1026,
    //   shopName: "Aero Auto Repair San Carlos",
    //   shopId: 3472,
    //   chainId:101,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1028,
    //   shopName: "O'Bryan Auto Repair",
    //   shopId: 1692,
    //   chainId:102,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1027,
    //   shopName: "O'Bryan Auto Repair",
    //   shopId: 331,
    //   chainId:102,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1029,
    //   shopName: "Matt's Automotive Service Center Pine City",
    //   shopId: 1873,
    //   chainId:104,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1030,
    //   shopName: "Matt's Automotive Service Center NOMO",
    //   shopId: 3539,
    //   chainId:104,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1031,
    //   shopName: "Matt's Automotive Service Center Fargo",
    //   shopId: 3540,
    //   chainId:104,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1032,
    //   shopName: "Matt's Automotive Service Center SOMO",
    //   shopId: 3541,
    //   chainId:104,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1033,
    //   shopName: "Matt's Automotive Service Center S Fago",
    //   shopId: 3542,
    //   chainId:104,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1034,
    //   shopName: "Matt's Automotive & Collision Center Collision",
    //   shopId: 3543,
    //   chainId:104,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1035,
    //   shopName: "Matt's Automotive Service Center Bloomington",
    //   shopId: 3547,
    //   chainId:104,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1036,
    //   shopName: "Matt's Automotive Service Center Columbia Heights",
    //   shopId: 3758,
    //   chainId:104,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1037,
    //   shopName: "Matt's Automotive Service Center Willmar",
    //   shopId: 3759,
    //   chainId:104,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1038,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 3761,
    //   chainId:104,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1039,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 293,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1040,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 309,
    //   chainId:0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1041,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 398,
    //   chainId:0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1042,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 2305,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1043,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 2442,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1044,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 3229,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1045,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 3351,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1046,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 3385,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1047,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 3520,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1048,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 3586,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1049,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 4120,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1050,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 4494,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1051,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 1216,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1052,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 1398,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1053,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 888,
    //   chainId: 0,
    //   software: "Tek"
    // },
    // {
    //   wowShopId: 1054,
    //   shopName: "Matt's Automotive Service Center North Branch",
    //   shopId: 4743,
    //   chainId: 0,
    //   software: "Tek"
    // },
  ],
  pro: [
    // {
    //   wowShopId: 1017,
    //   shopName:"Sours VA",
    //   fixedShopName: "Sours Automotive",
    //   shopId: "",
    //   chainId: 0,
    //   software: "pro"
    // },
    // {
    //   wowShopId: 1016,
    //   shopName:"AG Automotive - OR",
    //   fixedShopName: "AG Automotive",
    //   shopId: "",
    //   chainId: 0,
    //   software: "pro"
    // },
    // {
    //   wowShopId: 1018,
    //   shopName:"Highline – AZ",
    //   fixedShopName: "Highline Car Care",
    //   shopId: "",
    //   chainId: 0,
    //   software: "pro"
    // },
    // {
    //   wowShopId: 1013,
    //   shopName:"Toledo Autocare - B&L Whitehouse 3RD location",
    //   fixedShopName: "B&L Whitehouse Auto Service",
    //   shopId: "",
    //   chainId: 103,
    //   software: "pro"
    // },
    // {
    //   wowShopId: 1014,
    //   shopName:"Toledo Autocare - HEATHERDOWNS 2ND location",
    //   fixedShopName: "Toledo Auto Care",
    //   shopId: "",
    //   chainId: 103,
    //   software: "pro"
    // },
    // {
    //   wowShopId: 1015,
    //   shopName:"Toledo Autocare - Monroe Street 1ST location",
    //   fixedShopName: "Toledo Auto Care - Monroe",
    //   shopId: "",
    //   chainId: 103,
    //   software: "pro"
    // },
  ],
  sw: [
    // {
    //   wowShopId: 1019,
    //   shopName: "West St. Service Center",
    //   shopId: 5370,
    //   tenantId: 3065,
    //   chainId: 105,
    //   software: "SW"
    // },
    // {
    //   wowShopId: 1020,
    //   shopName: "Absolute Auto Repair Center - Shirley 2955",
    //   shopId: 2955,
    //   tenantId: 3065,
    //   chainId: 105,
    //   software: "SW"
    // },
    // {
    //   wowShopId: 1021,
    //   shopName: "Absolute Auto Repair Center - Fitchburg 2954",
    //   shopId: 2954,
    //   tenantId: 3065,
    //   chainId: 105,
    //   software: "SW"
    // },
    // {
    //   wowShopId: 1022,
    //   shopName: "Absolute Auto Repair Center - Fitchburg 2954",
    //   shopId: 4200,
    //   tenantId: 4186,
    //   chainId: 0,
    //   software: "SW"
    // }
  ],
  mit: [
    // {
    //   wowShopId: 1005,
    //   shopName: "Havasu Auto Care",
    //   shopId: "",
    //   chainId: 0,
    //   software: "mit"
    // },
    // {
    //   wowShopId: 1002,
    //   shopName: "Auto Service Special",
    //   shopId: "",
    //   chainId: 0,
    //   software: "mit"
    // },
    // {
    //   wowShopId: 1004,
    //   shopName: "Grand Garage",
    //   shopId: "",
    //   chainId: 0,
    //   software: "mit"
    // },
    // {
    //   wowShopId: 1001,
    //   shopName: "Advantage Auto Servi",
    //   shopId: "",
    //   chainId: 0,
    //   software: "mit"
    // },
    // {
    //   wowShopId: 1003,
    //   shopName: "Custom Automotive",
    //   shopId: "",
    //   chainId: 0,
    //   software: "mit"
    // },
    // {
    //   wowShopId: 1008,
    //   shopName: "Quality Auto",
    //   shopId: "",
    //   chainId: 0,
    //   software: "mit"
    // },
    // {
    //   wowShopId: 1007,
    //   shopName: "Olmsted Auto Care",
    //   shopId: "",
    //   chainId: 0,
    //   software: "mit"
    // },
    // {
    //   wowShopId: 1006,
    //   shopName: "Jenkins Auto",
    //   shopId: "",
    //   chainId: 0,
    //   software: "mit"
    // }
  ],
  nap: [
    // {
    //   wowShopId: 1009,
    //   shopName: "Hal''s",
    //   shopId: "",
    //   chainId: 0,
    //   software: "nap"
    // },
    // {
    //   wowShopId: 1010,
    //   shopName: "Steger",
    //   shopId: "",
    //   chainId: 0,
    //   software: "nap"
    // },
    // {
    //   wowShopId: 1011,
    //   shopName: "Velocity",
    //   shopId: "",
    //   chainId: 0,
    //   software: "nap"
    // },
    // {
    //   wowShopId: 1012,
    //   shopName: "Bryan''s",
    //   shopId: "",
    //   chainId: 0,
    //   software: "nap"
    // }
  ]
}

@Injectable()
export class JobsService {
  readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly tekService: TekService,
    private readonly swService: SwService,
    private readonly proService: ProService,
    private readonly napService: NapService,
    private readonly mitService: MitService,
    private readonly listcleanupNameService: ListcleanupNameService,
    private readonly listcleanupAddressService: ListcleanupAddressService,
    private readonly listcleanupDedupeService: ListcleanupDedupeService,
    private readonly listcleanupService: ListcleanupService,
    private readonly bdayAppendService: BdayappendService,
    private readonly mailinglistCountsService: MailinglistCountsService,
    private readonly mailinglistMaxListService: MailinglistMaxListService,
    private readonly mailinglistSaveCSVService: MailinglistSaveCSVService,
    private readonly mailinglistGenerateService: MailinglistGenerateService
  ) {
    this.runSyncJob = this.runSyncJob.bind(this);
    this.logException = this.logException.bind(this);
  }

  @Cron(new Date(Date.now() + 1 * 1000))
  //Runing hourly
  // @Cron("0 5-22 * * *", { timeZone: "America/Los_Angeles" }) 
  TEKMETRICtestJob() {
    return this.runSyncJob("Test Job", async () => {
      this.logger.log(`TEKMETRICTest job is executing...`);
      // const res = await this.mailinglistGenerateService.generateMailingLists("./accuzip_csv_files/Accuzip_result_oct.csv","./accuzip_csv_files/st joseph auto processed.csv", "./bday_append_output/bdayinput - bdayinput_Final.csv", "./accuzip_csv_files/Shop_position.csv", "./max_lists/oct_list.csv");
      
      // console.log(res);
      // await this.mailinglistSaveCSVService.createWholeShopsCSV("./accuzip_csv_files/Accuzip_result_oct.csv","./accuzip_csv_files/st joseph auto processed.csv", "./bday_append_output/bdayinput - bdayinput_Final.csv", "./accuzip_csv_files/Shop_position.csv", "./max_lists/oct_list.csv");

      // const res = await this.mailinglistGenerateService.generateMailingLists("./accuzip_csv_files/Accuzip_result_oct.csv","./accuzip_csv_files/st joseph auto processed.csv", "./bday_append_output/bdayinput - bdayinput_Final.csv", "./accuzip_csv_files/Shop_position.csv", "./max_lists/oct_list.csv");
      // const res = await this.mailinglistGenerateService.limitCounts("./accuzip_csv_files/Accuzip_result_oct.csv","./accuzip_csv_files/st joseph auto processed.csv", "./bday_append_output/bdayinput - bdayinput_Final.csv", "./accuzip_csv_files/Shop_position.csv", "./max_lists/oct_list.csv");

      const res = await this.mailinglistCountsService.assignTBday("./accuzip_csv_files/Accuzip_result_oct.csv","./accuzip_csv_files/st joseph auto processed.csv", "./bday_append_output/bdayinput - bdayinput_Final.csv", "./accuzip_csv_files/Shop_position.csv");

      console.log(res.filter(customer => customer.wsId === "1057").length)

      // console.log(res.length)

      // console.log(res.filter(customer => customer.wsId === "1006").length);

      // const res = await this.mailinglistSaveCSVService.saveTBdaylist("./accuzip_csv_files/Accuzip_result_oct.csv","./accuzip_csv_files/st joseph auto processed.csv", "./bday_append_output/bdayinput - bdayinput_Final.csv", "./accuzip_csv_files/Shop_position.csv");

      // await this.mailinglistSaveCSVService.saveMailinglist("./accuzip_csv_files/Accuzip_result_oct.csv","./accuzip_csv_files/st joseph auto processed.csv", "./bday_append_output/bdayinput - bdayinput_Final.csv", "./accuzip_csv_files/Shop_position.csv")


      // const res = await this.mailinglistMaxListService.getMaxLists("./max_lists/oct_list.csv");

      // console.log(res);

      
    });
  }

  async runSyncJob(name: string, func: () => Promise<void>) {
    this.logger.log(`START ${name}...`);
    await func();
    this.logger.log(`END ${name}...`);
  }

  logException(ex: unknown) {
    if (typeof ex === "object" && ex !== null && "message" in ex) {
      const err = ex as Error;
      this.logger.error(err.message, err.stack);
    } else {
      this.logger.error(ex);
    }
  }
}
