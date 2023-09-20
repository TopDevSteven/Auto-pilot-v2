import { Injectable } from '@nestjs/common';
import * as fs from "fs";
import csv from "csv-parser";

@Injectable()
export class MailinglistMaxListService {
    async getMaxLists(filePath: string): Promise <{shopid: string, values: string} []> {
        const results: any = [];
        return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on(
            "data",
            (data: {
                WSID: string,
                maxOct: string
            }) => {
                results.push({
                    shopid: data['WSID'].trim(),
                    values: Number(data['maxOct'].trim()),
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
}
