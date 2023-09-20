import { Inject, Injectable } from '@nestjs/common';
import { customerObject } from '../tek/tek.service';
import { Pool } from 'pg';

@Injectable()
export class MitService {
    constructor(
        @Inject("DB_CONNECTION") private readonly db: Pool
    ) {}

    async fetchCustomers(shopName: string, wowShopId: number, chainId: number, software: string): Promise<customerObject[]> {
        const res = await this.db.query({
            text: `
                SELECT DISTINCT
                    c.id,
                    c.shopname as shopname,
                    c.lastvisited_date as authdate,
                    c.firstname as firstname,
                    c.lastname as lastname,
                    c.address_ as address,
                    c.city as city,
                    c.state_ as state,
                    c.zip as zip,
                    c.year_ as byear,
                    c.month_ as bmonth
                FROM mitcustomer c
                WHERE c.shopname = $1
                AND TO_DATE(c.lastvisited_date, 'MM/DD/YYYY') >= (CURRENT_DATE - INTERVAL '4 years 3 months');
            `,
            values: [shopName],
            }
        )

        return res.rows.map((row) => ({
            id: row.id,
            firstName: row.firstname,
            lastName: row.lastname,
            address: row.address,
            address2: "",
            city: row.city,
            state: row.state,
            zip: row.zip,
            authDate: new Date(row.authdate),
            byear: row.byear,
            bmonth: row.bmonth,
            bday: "",
            shopName: row.shopname,
            shopPhone: "",
            shopEmail: "",
            software: software,
            wowShopId: wowShopId,
            chainId: chainId,
            shopId: "",
        }));
    }
}
