import { Injectable } from '@nestjs/common';
import * as fs from "fs";
import csv from "csv-parser";
import { customerObject } from '../bdayappend/bdayappend.service';
import { bdayCustomerObject } from '../bdayappend/bdayappend.service';

import { BdayappendService } from '../bdayappend/bdayappend.service';
import { BdayAppendDistanceService } from '../bdayappend/bdayappend.distance.service';

type bdayObject = {
    cid: string;
    wsid: string;
    first: string;
    last:string;
    address: string;
    bdayyr: string;
    bdaymo: string;
}

@Injectable()
export class MailinglistCountsService {
    constructor (
        private readonly bdayappendService: BdayappendService,
        private readonly bdayAppendDistanceService: BdayAppendDistanceService
    ) {}


    async readAccuzipResult(filePath: string): Promise <customerObject []> {
        const results: any = [];
        return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on(
            "data",
            (data: {
                wsid: string;
                wcaid: string;
                software: string;
                sid: string;
                cid: string;
                authdate: string;
                mbdayyr: string;
                mbdaymo: string;
                tbdaymo: string;
                first: string;
                last: string;
                address: string;
                address2: string;
                city: string;
                st: string;
                zip: string;
                status_: string;
                latitude_: string;
                longitude_: string;
            }) => {
                results.push({
                    wsId: data["wsid"].trim(),
                    wcaId: data["wcaid"].trim(),
                    software: data["software"].trim(),
                    shopId: data["sid"].trim(),
                    customerId: data["cid"].trim(),
                    authdate: data["authdate"].trim(),
                    mbdayyr: data["mbdayyr"].trim(),
                    mbdaymo: data["mbdaymo"].trim(),
                    tbdaymo: data["tbdaymo"].trim(),
                    firstName: data["first"].trim(),
                    lastName: data["last"].trim(),
                    address: data["address"].trim(),
                    address2: data["address2"].trim(),
                    city: data["city"].trim(),
                    state: data["st"].trim(),
                    zip: data["zip"].trim(),
                    status: data["status_"].trim(),
                    latitude: Number(data["latitude_"].trim()),
                    logitude: Number(data["longitude_"].trim())
                });
            },
            )
            .on("end", () => {
            resolve(results);
            })

            .on("error", (error) => {
            reject(error);
            });
        });
    }

    async readAppendedBday(filePath: string): Promise <bdayObject []> {
        const results: any = [];
        return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on(
            "data",
            (data: {
                CID: string,
                WSID: string,
                First: string,
                Last: string,
                Address: string,
                "DOB Month": string,
                "DOB Year": string
            }) => {
                results.push({
                    cid: data["CID"].trim(),
                    wsid: data["WSID"].trim(),
                    first: data["First"].trim(),
                    last: data['Last'].trim(),
                    address: data['Address'].trim(),
                    bdayyr: data['DOB Year'].trim(),
                    bdaymo: String(Number(data['DOB Month'].trim()))
                });
            },
            )
            .on("end", () => {
            resolve(results);
            })

            .on("error", (error) => {
            reject(error);
            });
        });
    }

    async appendBday(filePath: string, stPath: string, bdayPath: string): Promise <customerObject [] > {
        const noBdayCustomers1 = await this.readAccuzipResult(filePath);
        const noBdayCustomers2 = await this.readAccuzipResult(stPath);

        noBdayCustomers2.map(customer => {
            customer.wsId = "1056";
        });

        const noBdayCustomers = [
            ...noBdayCustomers1,
            ...noBdayCustomers2
        ];

        const bdays = await this.readAppendedBday(bdayPath);

        const bdayMap = new Map<string, bdayObject>();

        bdays.forEach((bday) => {
            const key = `${bday.cid.trim()}-${bday.first.trim()}-${bday.last.trim()}-${bday.address.trim()}`.toLowerCase();
            bdayMap.set(key, bday);
        })

        noBdayCustomers.forEach((customer) => {
            const key = `${customer.customerId.trim()}-${customer.firstName.trim()}-${customer.lastName.trim()}-${customer.address.trim()}`.toLowerCase();
            const matchingBday = bdayMap.get(key);

            if (matchingBday) {
                customer.mbdayyr = matchingBday.bdayyr;
                customer.mbdaymo = matchingBday.bdaymo
            }
        })

        return noBdayCustomers;
        
    }

    async limitBased25Mi(filePath: string, stPath: string, bdayPath: string, storePath: string): Promise <bdayCustomerObject []> {
        const customers = await this.appendBday(filePath, stPath, bdayPath);
        const storePosition = await this.bdayappendService.getStorePosition(storePath);

        const newCustomers = await Promise.all(
            customers.map(customer => {
                const customerLat = customer.latitude;
                const customerLon = customer.logitude;
                const shop = storePosition.find(shop => shop.wsid == customer.wsId);
                let distance = null
                let isMailable = false
                if (shop){
                    const shopLat = shop.latitude;
                    const shopLon = shop.logitude;
                    distance = this.bdayAppendDistanceService.calculateDistance(customerLat, customerLon, shopLat, shopLon);

                    if (distance * 0.621371 <= 25) {
                        isMailable = true;
                    }
                }
                return {
                    ...customer,
                    wcId: "",
                    distance: distance != null? distance *  0.621371 : null,
                    isMailable: isMailable,
                    shopname: shop? shop.name: ""
                }
            })
        )

        return newCustomers;
      }
      
    async limitBased50Mi(filePath: string, stPath: string, bdayPath: string, storePath: string): Promise <bdayCustomerObject []> {
      const newCustomers = await this.limitBased25Mi(filePath, stPath, bdayPath, storePath)
      const storePosition = await this.bdayappendService.getStorePosition(storePath);

      let result: {[key: string]: {true: number, false: number}} = {};
      let shops: string [] = [];

      newCustomers.forEach(customer => {
        if (!result[customer.wsId]) {
          result[customer.wsId] = {true: 0, false: 0};
        }

        result[customer.wsId][customer.isMailable ? 'true' : 'false'] += 1;
      })

      for (let wsId in result) {
        let trueCount = result[wsId].true;
        let falseCount = result[wsId].false;

        if (trueCount < falseCount * 9) {
            shops.push(wsId);
            await Promise.all(
              newCustomers.filter((customer => customer.wsId === wsId)).map(customer => {
                const customerLat = customer.latitude;
                const customerLon = customer.logitude;
                const shop = storePosition.find(shop => shop.wsid === wsId);
                let distance = null;
                if (shop){
                    const shopLat = shop.latitude;
                    const shopLon = shop.logitude;
                    distance = this.bdayAppendDistanceService.calculateDistance(customerLat, customerLon, shopLat, shopLon);
                    if (distance * 0.621371 <= 50) {
                        customer.isMailable = true;
                    } else {
                      customer.isMailable = false;
                    }
                }
              })
            )
        }
      }

      return newCustomers;
    }

    async listCleanup(filePath: string, stPath: string, bdayPath: string, storePath: string) {
        const customers = await this.limitBased50Mi(filePath, stPath, bdayPath, storePath);
        const newCustomers = customers.map((customer) => {
            let nameCode = {
                firstName : "",
                lastName: "",
                fullName: ""
            };

            let newCustomer = {...customer};

            if (Number(newCustomer.mbdaymo) === 0) {
                newCustomer.tbdaymo = "";
                newCustomer.mbdaymo = "";
            }

            newCustomer.tbdaymo = "";

            const keywords = [
                "Associates",
                "Auto Body",
                "Autobody",
                "Center",
                "Company",
                "Corp",
                "Dept",
                "Enterprise",
                "Inc.",
                "Insurance",
                "Landscap",
                "LLC",
                "Motor",
                "Office",
                "Rental",
                "Repair",
                "Salvage",
                "Service",
                "Supply",
                "Tire",
                "Towing",
            ];

            if (/[-&,*^\/]|(\()|( and )|( OR )/i.test(newCustomer.firstName)) {
                newCustomer.firstName = newCustomer.firstName
                  .split(/[-&,*^\/]|(\()|( and )|( OR )/i)[0]
                  .trim();
                nameCode.firstName = "New Name";
                if (
                  /'\s|[@]/.test(newCustomer.firstName) ||
                  newCustomer.firstName.trim().split(/\s/).length > 2
                ) {
                  newCustomer.firstName = "";
                  nameCode.firstName = "Bad Name";
                } else if (
                  newCustomer.firstName.trim().length === 1 ||
                  newCustomer.firstName.trim().length === 0
                ) {
                  newCustomer.firstName = "";
                  nameCode.firstName = "Bad Name";
                } else if (
                  /\d/.test(newCustomer.firstName) ||
                  newCustomer.firstName.includes("'S ") ||
                  newCustomer.firstName.includes("'s ")
                ) {
                  newCustomer.firstName = "";
                  nameCode.firstName = "Bad Name";
                } else if (
                  keywords.some((keyword) => newCustomer.firstName.includes(keyword))
                ) {
                  newCustomer.firstName = "";
                  nameCode.firstName = "Bad Name";
                } else if (
                  /\bAuto\b/.test(newCustomer.firstName) ||
                  /\bCar\b/.test(newCustomer.firstName) ||
                  /\bInc\b/.test(newCustomer.firstName) ||
                  /\bTown\b/.test(newCustomer.firstName)
                ) {
                  newCustomer.firstName = "";
                  nameCode.firstName = "Bad Name";
                } else if (
                  newCustomer.firstName.trim().length > 12
                ) {
                  newCustomer.firstName = "";
                  nameCode.firstName = "Bad Name";
                }
              } else if (
                /'\s|[@]/.test(newCustomer.firstName) ||
                newCustomer.firstName.trim().split(/\s/).length > 2
              ) {
                newCustomer.firstName = "";
                nameCode.firstName = "Bad Name";
              } else if (
                newCustomer.firstName.trim().length === 1 ||
                newCustomer.firstName.trim().length === 0
              ) {
                newCustomer.firstName = "";
                nameCode.firstName = "Bad Name";
              } else if (
                /\d/.test(newCustomer.firstName) ||
                newCustomer.firstName.includes("'S ") ||
                newCustomer.firstName.includes("'s ")
              ) {
                newCustomer.firstName = "";
                nameCode.firstName = "Bad Name";
              } else if (
                keywords.some((keyword) => newCustomer.firstName.includes(keyword))
              ) {
                newCustomer.firstName = "";
                nameCode.firstName = "Bad Name";
              } else if (
                /\bAuto\b/.test(newCustomer.firstName) ||
                /\bCar\b/.test(newCustomer.firstName) ||
                /\bInc\b/.test(newCustomer.firstName) ||
                /\bTown\b/.test(newCustomer.firstName)
              ) {
                newCustomer.firstName = "";
                nameCode.firstName = "Bad Name";
              } else if (
                newCustomer.firstName.trim().length > 12
              ) {
                newCustomer.firstName = "";
                nameCode.firstName = "Bad Name";
              } else {
                nameCode.firstName = "";
              }
        
              if (/[-,*^\/]/.test(newCustomer.lastName)) {
                let splitName = newCustomer.lastName.split(/[-,*^\/]/);
                if (splitName[1].length === 0) {
                  newCustomer.lastName = splitName[0].trim();
                  if (newCustomer.lastName.includes(" OR ")) {
                    newCustomer.lastName = newCustomer.lastName.split(" OR ")[1];
                  }
                } else {
                  newCustomer.lastName = splitName[1].trim();
                  if (newCustomer.lastName.includes(" OR ")) {
                    newCustomer.lastName = newCustomer.lastName.split(" OR ")[1];
                  }
                }
                nameCode.lastName = "New Name";
                if (
                  /[@]|[&]|(\))/.test(newCustomer.lastName) ||
                  newCustomer.lastName.trim().length === 1
                ) {
                  newCustomer.lastName = "";
                  nameCode.lastName = "Bad Name";
                } else if (
                  /\d/.test(newCustomer.lastName) ||
                  newCustomer.lastName.includes("'S ") ||
                  newCustomer.lastName.includes("'s ") ||
                  newCustomer.lastName.split(".").length > 2
                ) {
                  newCustomer.lastName = "";
                  nameCode.lastName = "Bad Name";
                } else if (
                  newCustomer.lastName.trim().length > 14
                ) {
                  newCustomer.lastName = "";
                  nameCode.lastName = "Bad Name";
                }
              } else if (
                /[@]|[&]|(\))/.test(newCustomer.lastName) ||
                newCustomer.lastName.trim().length === 1 ||
                newCustomer.lastName.trim().length === 0
              ) {
                newCustomer.lastName = "";
                nameCode.lastName = "Bad Name";
              } else if (
                /\d/.test(newCustomer.lastName) ||
                newCustomer.lastName.includes("'S ") ||
                newCustomer.lastName.includes("'s ") ||
                newCustomer.lastName.split(".").length > 2
              ) {
                newCustomer.lastName = "";
                nameCode.lastName = "Bad Name";
              } else if (
                newCustomer.lastName.trim().length > 14
              ) {
                newCustomer.lastName = "";
                nameCode.lastName = "Bad Name";
              } else {
                nameCode.lastName = "";
              }
        
              if (
                nameCode.firstName == "Bad Name" ||
                nameCode.lastName == "Bad Name"
              ) {
                nameCode.fullName = "Bad Name";
              } else if (
                nameCode.firstName == "New Name" ||
                nameCode.lastName == "New Name"
              ) {
                nameCode.fullName = "New Name";
              } else {
                nameCode.fullName = "";
              }

              return newCustomer;
        })

        return newCustomers.filter(customer => customer.firstName.trim() !== "" || customer.lastName.trim() !== "");
    }

    async dedupe(filePath: string, stPath: string, bdayPath: string, storePath: string) {
        const customers = await this.listCleanup(filePath, stPath, bdayPath, storePath);
        const counts = new Map<string, number>();
        const mailables = new Map<string, Date>();
        const sortedCustomers = [...customers].sort(
            (a,b ) => new Date(b.authdate).getTime() - new Date(a.authdate).getTime(),
        );

        sortedCustomers.forEach((customer) => {
            const {
                firstName,
                lastName,
                address,
                authdate,
                wcaId,
                wsId,
                software,
            } = customer;
            const key = 
                wcaId != null || wcaId != ""
                    ? `${firstName}-${lastName}-${address}-${wcaId}-${software}`
                    : `${firstName}-${lastName}-${address}-${wsId}-${software}`;
            counts.set(key, (counts.get(key) || 0) + 1);
            if (!mailables.has(key)) {
                mailables.set(key, new Date(authdate));
            }
        });
        const deDuplicatedCustomers = customers.map((customer) => {
            const {
                firstName,
                lastName,
                address,
                authdate,
                wcaId,
                wsId,
                software,
            } = customer;
            const key = 
                wcaId != null || wcaId != ""
                    ? `${firstName}-${lastName}-${address}-${wcaId}-${software}`
                    : `${firstName}-${lastName}-${address}-${wsId}-${software}`;
            const isDuplicate = 
                (counts.get(key) || 0) > 1 && mailables.get(key) !== new Date(authdate)
                    ? "Duplicate"
                    : "";

            return {...customer, isDuplicate}
        })

        return deDuplicatedCustomers;
    }

    async assignTBday(filePath: string, stPath: string, bdayPath: string, storePath: string) {
        const noTobdayCustomers = await this.dedupe(filePath, stPath, bdayPath, storePath);

        const newSortedCustomers = noTobdayCustomers.filter(customer => customer.isMailable === true).sort((a, b) => {
            const dateComparison = new Date(a.authdate).getTime() - new Date(b.authdate).getTime();

            if (dateComparison !== 0) {
                return dateComparison;
            }

            return Number(a.mbdaymo) - Number(b.mbdaymo);
        });

        const countsByShopAndMonth: Record<string, Record<string, number>> = {};

        newSortedCustomers.forEach(customer => {
            let {wsId, mbdaymo} = customer;

            mbdaymo = String(Number(mbdaymo));

            if (!(wsId in countsByShopAndMonth)) {
                countsByShopAndMonth[wsId] = {};
            }

            countsByShopAndMonth[wsId][mbdaymo] = (countsByShopAndMonth[wsId][mbdaymo] || 0) + 1;
        });

        const averageByShop: Record<string, {average: number; remainder: number}> = {};

        for (const wsId in countsByShopAndMonth) {
            const counts = Object.values(countsByShopAndMonth[wsId]);
            const totalCustomers = counts.reduce((total, count) => total + count, 0);
            const average = Math.floor(totalCustomers / 12);
            const remainder = totalCustomers % 12;
            averageByShop[wsId] = {average, remainder};
        }

        const tbdayCounts: Record<string, Record<string, number>> = {};

        for (const wsId in countsByShopAndMonth) {
            tbdayCounts[wsId] = {};
            for (const mbdaymo in countsByShopAndMonth[wsId]) {
                if (mbdaymo !== "0") {
                    const actualCount = countsByShopAndMonth[wsId][mbdaymo];
                    let {average, remainder} = averageByShop[wsId];
                    tbdayCounts[wsId][mbdaymo] = Math.max(0, average - actualCount);
                }
            };
                
            let tbdaySum = Object.values(tbdayCounts[wsId]).reduce((sum, count) => sum + count, 0);
            averageByShop[wsId].remainder = countsByShopAndMonth[wsId]["0"] - tbdaySum;

            while (averageByShop[wsId].remainder < 0) {
                let {average, remainder} = averageByShop[wsId];
                average -= 1;
                for (const mbdaymo in countsByShopAndMonth[wsId]) {
                    if (mbdaymo !== "0") {
                        const actualCount = countsByShopAndMonth[wsId][mbdaymo];
                        tbdayCounts[wsId][mbdaymo] = Math.max(0, average - actualCount);
                    }
                };

                let tbdaySum = Object.values(tbdayCounts[wsId]).reduce((sum, count) => sum + count, 0);
                averageByShop[wsId].remainder = countsByShopAndMonth[wsId]["0"] - tbdaySum;
                averageByShop[wsId].average = average;
            }
        };

        for (const wsId in averageByShop) {
            const {average, remainder } = averageByShop[wsId];
            const months = Object.keys(countsByShopAndMonth[wsId]).slice(1);

            if (remainder >= 0 ) {
                months.sort((a, b) => countsByShopAndMonth[wsId][a] - countsByShopAndMonth[wsId][b]);
                const lowestCountMonth = months.find((month) => countsByShopAndMonth[wsId][month] > 0);

                if (lowestCountMonth) {
                    tbdayCounts[wsId][lowestCountMonth] += remainder;
                }
            } 
        };

        const results: Record<string, any>[] = [];

        for (const wsId in countsByShopAndMonth) {
            for (const mbdaymo in countsByShopAndMonth[wsId]) {
                if (mbdaymo !== "0") 
                {
                    const actualCount = countsByShopAndMonth[wsId][mbdaymo] || 0;
                    const tbdayCount = tbdayCounts[wsId][mbdaymo] || 0; // Ensuring tbdayCount is defined and falls back to 0 if undefined
                    results.push({
                        id: wsId,
                        mbdaymo,
                        bdaymo: actualCount,
                        tbdaymo: tbdayCount,
                        all: actualCount + tbdayCount
                    });
                }
            }
        }

        const groupData: {[key: string]: any []} = {};

        results.forEach(data => {
            if (!groupData[data.id]) {
                groupData[data.id] = [];
            }

            groupData[data.id].push(data);
        })

        for (const id in groupData) {
            groupData[id].sort((a,b) => a.bdaymo - b.bdaymo);
        }

        const customersWithEmptyMbdaymo = newSortedCustomers.sort((a,b) => new Date(b.authdate).getTime() - new Date(a.authdate).getTime());

        let customerUpdateCount: { [key: string]: number } = {};

        Object.keys(groupData).forEach(id =>{
            const shopData = groupData[id];
            shopData.forEach(monthData => {
              if (!customerUpdateCount[monthData.mbdaymo]) {
                customerUpdateCount = {
                  ...customerUpdateCount,
                  [monthData.mbdaymo]: 0
                };
              }
              for (let i = 0 ; i < customersWithEmptyMbdaymo.length ; i++) {
                let customer = customersWithEmptyMbdaymo[i];
                  if (customer.wsId.trim() === id.trim() && Number(customer.mbdaymo) === 0 && Number(customer.tbdaymo) === 0) {
                      customer.tbdaymo = monthData.mbdaymo;
                      customerUpdateCount = {
                        ...customerUpdateCount,
                        [monthData.mbdaymo] : customerUpdateCount[monthData.mbdaymo] + 1
                      };
                  }
                  if (customerUpdateCount[monthData.mbdaymo] >= monthData.tbdaymo) {
                      customerUpdateCount = {
                        ...customerUpdateCount,
                        [monthData.mbdaymo]: 0
                      };
                      break;
                  }
              }
            })
        })


        return customersWithEmptyMbdaymo;
    }

}
