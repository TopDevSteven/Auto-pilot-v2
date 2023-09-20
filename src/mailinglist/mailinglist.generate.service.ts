import { Injectable } from '@nestjs/common';
import { MailinglistCountsService } from './mailinglist.counts.service';
import { MailinglistMaxListService } from './mailinglist.maxlists.service';
import { customerObject } from '../bdayappend/bdayappend.service';

@Injectable()
export class MailinglistGenerateService {
    constructor (
        private readonly mailinglistCountsService: MailinglistCountsService,
        private readonly mailinglistMaxListService: MailinglistMaxListService
    ) {}

    async limitCounts(filePath: string, stPath: string, bdayPath: string, storePath: string, limitPath: string){ 
        const customers = await this.mailinglistCountsService.assignTBday(filePath, stPath, bdayPath, storePath);
        const maxLists = (await this.mailinglistMaxListService.getMaxLists(limitPath)).slice(1);

        const newCustomers = customers
            .filter(customer => 
                Number(customer.mbdaymo) === 10 ||
                Number(customer.mbdaymo) === 4 ||
                Number(customer.tbdaymo) === 4 || 
                Number(customer.tbdaymo) === 10
            )
            .sort((a, b) => {
                const wsIDDiff = Number(a.wsId) - Number(b.wsId);

                if (wsIDDiff !== 0) {
                return wsIDDiff;
                } else {
                const mbdaymoDiff = Number(b.mbdaymo) - Number(a.mbdaymo);

                if (mbdaymoDiff !== 0) {
                    return mbdaymoDiff;
                } else {
                    const dateDiff = new Date(a.authdate).getTime() - new Date(b.authdate).getTime();
                    return dateDiff;
                }
                }
            });

        const newResult = newCustomers.reduce((result, customer) => {
            if (!result[customer.wsId]) {
                result = {
                    ...result,
                    [customer.wsId]: []
                }
            }
            const limit = Number( maxLists.find((shop) => {
                return shop.shopid === customer.wsId
            })?.values ?? 999999)
            
            if (limit > result[customer.wsId].length) {
                result = {
                    ...result,
                    [customer.wsId]: [...result[customer.wsId], customer] 
                }
            }
            return result
        }, {} as Record<string, any>)
        
        return newResult;
    };

    async generateMailingLists(filePath: string, stPath: string, bdayPath: string, storePath: string, limitPath: string) {
        const customer = await this.limitCounts(filePath, stPath, bdayPath, storePath, limitPath);
        const combinedArray = ([] as any[]).concat(...Object.values(customer));

        const updatedCustomers = combinedArray.map(customer => {
                if (Number(customer.mbdaymo) === 4) {
                    return {
                        ...customer,
                        ListName: "HDayList 10"
                    };
                } else if ( Number(customer.mbdaymo) === 10) {
                    return {
                        ...customer,
                        ListName: "BDayList 10"
                    }
                } else if (Number(customer.tbdaymo) === 10 || Number(customer.tbdaymo) === 4){
                    return {
                        ...customer,
                        ListName: "THDayList 10"
                    }
                } else {
                    return {
                        ...customer,
                        ListName: "",
                    }
                }
        })

        return updatedCustomers;
    }

    async generateMailingListsPerShop(filePath: string, stPath: string, bdayPath: string, storePath: string, limitPath: string) {
        const customers = await this.generateMailingLists(filePath, stPath, bdayPath, storePath, limitPath);

        const wsidListname = new Map<string, any []>();
        const keys = new Map<string, number>()
        customers.forEach((customer) => {
            const {wsId, ListName, shopname} = customer;

            if (ListName != "") {
                const key  = `${wsId}-${ListName}-${shopname}`
                keys.set(key, (keys.get(key) || 0) + 1);
                if(!wsidListname.has(key)) {
                    wsidListname.set(key, []);
                }
                wsidListname.get(key)?.push(customer)
            }
            
        })
        
        return Array.from(wsidListname.values());
    }
}
