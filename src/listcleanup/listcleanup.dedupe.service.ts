import { Injectable, Inject } from '@nestjs/common';
import { TekService } from '../tek/tek.service';
import { SwService } from '../sw/sw.service';
import { ProService } from '../pro/pro.service';
import { NapService } from '../nap/nap.service';
import { MitService } from '../mit/mit.service';
import { ListcleanupAddressService } from './listcleanup.address.service';
import { customerObject } from '../tek/tek.service';

export type allShopObject = {
    tek: {
        wowShopId: number;
        shopName: string;
        shopId: number;
        chainId: number;
        software: string;
    } [],
    sw: {
        wowShopId: number;
        shopName: string;
        shopId: number;
        tenantId: number;
        chainId: number;
        software: string;
    } [],
    pro: {
        wowShopId: number;
        shopName: string;
        fixedShopName: string;
        shopId: string;
        chainId: number;
        software: string;
    } [],
    mit: {
        wowShopId: number;
        shopName: string;
        shopId: string;
        chainId: number;
        software: string;
    } [],
    nap: {
        wowShopId: number;
        shopName: string;
        shopId: string;
        chainId: number;
        software: string;
    } []
}

type cleanedCustomerObject =  {
    id: string;
    oldFirstName: string;
    oldLastName: string;
    newFirstName: string;
    newLastName: string;
    nameCode: string;
    byear: string;
    bmonth: string;
    bday: string;
    address: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    shopName: string;
    strAuthDate: string;
    authDate: Date;
    software: string;
    wowShopId: number;
    chainId: number | null;
    shopId: string | number | null;
    isBadAddress: string;
    isDuplicate: string;
    TBDayMo: string;
    WCAID: string;
}

@Injectable()
export class ListcleanupDedupeService {
    constructor(
        private readonly tekService: TekService,
        private readonly swService: SwService,
        private readonly proService: ProService,
        private readonly mitService: MitService,
        private readonly napService: NapService,
        private readonly listcleanupAddressService: ListcleanupAddressService
    ){}

    async mergedCustomers(allShops: allShopObject) : Promise <customerObject []> {
        const tekCustomers = allShops.tek.length !== 0 
        ? await Promise.all(
            allShops.tek.map((shop) => this.tekService.fetchCustomers(shop.shopId, shop.wowShopId, shop.chainId, shop.software))
        ) : [];

        const swCustomers = allShops.sw.length !== 0
        ? await Promise.all(
            allShops.sw.map((shop) => this.swService.fetchCustomers(shop.tenantId, shop.shopId, shop.wowShopId, shop.chainId, shop.software))
        ) : [];

        const proCustomers = allShops.pro.length !== 0
        ? await Promise.all(
            allShops.pro.map((shop) => this.proService.fetchCustomers(shop.shopName, shop.fixedShopName, shop.wowShopId, shop.chainId, shop.software))
        ) : [];

        const mitCustomers = allShops.mit.length !== 0
        ? await Promise.all(
            allShops.mit.map((shop) => this.mitService.fetchCustomers(shop.shopName, shop.wowShopId, shop.chainId, shop.software))
        ) : [];

        const napCustomers = allShops.nap.length !== 0
        ? await Promise.all(
            allShops.nap.map((shop) => this.napService.fetchCustomers(shop.shopName, shop.wowShopId, shop.chainId, shop.software))
        ) : [];

        console.log(napCustomers);

        return [
            ...tekCustomers.flat(),
            ...swCustomers.flat(),
            ...proCustomers.flat(),
            ...mitCustomers.flat(),
            ...napCustomers.flat()
        ]
    };

    async dedupeCustomers(allShops: allShopObject): Promise<cleanedCustomerObject []> {
        const rawCustomers = await this.mergedCustomers(allShops);
        const cleanedCustomersBasedAddress = await this.listcleanupAddressService.cleanupOnAddress(rawCustomers);
        const counts = new Map<string, number>();
        const mailables = new Map<string, Date>();

        const sortedCutomers = [...cleanedCustomersBasedAddress].sort(
            (a, b) => b.authDate.getTime() - a.authDate.getTime()
        );

        sortedCutomers.forEach((customer) => {
            const {
                newFirstName,
                newLastName,
                address,
                address2,
                wowShopId,
                chainId,
                authDate,
                software
            } = customer;

            const key = 
                chainId !== null && chainId !== 0
                    ? `${newFirstName}-${newLastName}-${address}-${address2}-${chainId}-${software}`
                    : `${newFirstName}-${newLastName}-${address}-${address2}-${wowShopId}-1-${software}`;
            
            counts.set(key, (counts.get(key) || 0) + 1);

            if (!mailables.has(key)) {
                mailables.set(key, authDate);
            }
        });

        const addDupeCustomers = cleanedCustomersBasedAddress.map((customer) => {
            
            if (customer.address.includes("&#xD;")) {
                const singleLineAddress = customer.address.replace(/\n/g, ' ');
                customer.address = singleLineAddress.replace(/&#xD;/g, "");
            };

            const {
                newFirstName,
                newLastName,
                address,
                address2,
                wowShopId,
                chainId,
                authDate,
                software
            } = customer;

            const key = 
                chainId !== null && chainId !== 0
                ? `${newFirstName}-${newLastName}-${address}-${address2}-${chainId}-${software}`
                : `${newFirstName}-${newLastName}-${address}-${address2}-${wowShopId}-1-${software}`;
            
            const isDuplicate = (counts.get(key) || 0) > 1 && mailables.get(key) !== authDate
                ? "Duplicate"
                : "";
            
            return {
                ...customer,
                isDuplicate
            };
        })

        const removeFlagsCustomers = addDupeCustomers.filter((item) => 
            item.isBadAddress !== "Bad Address" &&
            item.isDuplicate !== "Duplicate" &&
            item.nameCode !== "Bad Name"
        );

        const newSortedCustomers = removeFlagsCustomers.sort((a, b) => {
            const dateComparison = a.authDate.getTime() - b.authDate.getTime();

            if (dateComparison !== 0) {
                return dateComparison;
            }

            return Number(a.bmonth) - Number(b.bmonth);
        });

        let count = -1;

        return newSortedCustomers.map((customer) => {
            if (customer.bmonth.trim() === "00" || customer.bmonth.trim() === "0") {
                customer.bmonth = "";
            }

            if (customer.bmonth === "") {
                count += 1;
            }

            if (customer.chainId === 0 ) {
                customer.chainId = null;
            }

            return {
                ...customer,
                TBDayMo:
                    customer.bmonth === ""
                        ? (count % 12 + 1).toString()
                        : "",
                WCAID: ""
            };
        });
    };

    async counts(allShops: allShopObject) {
        const customers = await this.dedupeCustomers(allShops);
        const countsByShopId: any = {};

        customers.forEach((customer) => {
            if (!countsByShopId[customer.wowShopId]) {
                countsByShopId[customer.wowShopId] = {bd: 0, hd: 0, td: 0, shopName: customer.shopName, id: customer.wowShopId, software: customer.software};
            };

            if (Number(customer.bmonth.trim()) === 9) {
                countsByShopId[customer.wowShopId].bd += 1;
            } else if (Number(customer.bmonth.trim()) === 3) {
                countsByShopId[customer.wowShopId].hd += 1;
            } else if (Number(customer.TBDayMo.trim()) === 3 || Number(customer.TBDayMo.trim()) === 9) {
                countsByShopId[customer.wowShopId].td += 1;
            };
        });

        return Object.values(countsByShopId);
    };
}
