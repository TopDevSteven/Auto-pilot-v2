import { Injectable } from '@nestjs/common';
import { allShopObject } from './listcleanup.dedupe.service';
import { ListcleanupDedupeService } from './listcleanup.dedupe.service';
const csvWriter = require("csv-writer");
import path from "path";

@Injectable()
export class ListcleanupService {
    constructor(
        private readonly listcleanupDedupeService: ListcleanupDedupeService
    ) {}
    
    async exportCountsCSV(allShops: allShopObject) {
        const counts = await this.listcleanupDedupeService.counts(allShops);

        const writer = csvWriter.createObjectCsvWriter({
            path: path.resolve(__dirname, "./csv/counts.csv"),
            header: [
              { id: "id", title: "WSID" },
              { id: "shopname", title: "Shopname" },
              { id: "software", title: "Software" },
              { id: "bd", title: "BDaycounts" },
              { id: "hd", title: "HDaycounts" },
              { id: "td", title: "TDaycounts" },
            ],
        })
      
        await writer.writeRecords(counts).then(() => {
        console.log("Done!");
        });
    }

    async exportMailingListCSV(allShops: allShopObject) {
        const customers = await this.listcleanupDedupeService.dedupeCustomers(allShops);

        const writer = csvWriter.createObjectCsvWriter({
            path: path.resolve(__dirname, "./csv/Accuzip Input.csv"),
            header: [
              { id: "wowShopId", title: "WSID" },
              { id: "WCAID", title: "WCID" },
              { id: "chainId", title: "WCAID" },
              { id: "software", title: "Software" },
              { id: "shopId", title: "SID" },
              { id: "id", title: "CID" },
              { id: "shopName", title: "Shop Name"},
              { id: "strAuthDate", title: "AuthDate" },
              { id: "byear", title: "MBDayYr" },
              { id: "bmonth", title: "MBDayMo" },
              { id: "TBDayMo", title: "TBDayMo" },
              { id: "oldFirstName", title: "Old First"},
              { id: "oldLastName", title: "Old Last"},
              { id: "newFirstName", title: "First" },
              { id: "newLastName", title: "Last" },
              { id: "address", title: "Address" },
              { id: "address2", title: "Address2" },
              { id: "city", title: "City" },
              { id: "state", title: "St" },
              { id: "zip", title: "Zip" },
            ],
        });
      
        await writer.writeRecords(customers).then(() => {
        console.log("Done!");
        });
    }
}
