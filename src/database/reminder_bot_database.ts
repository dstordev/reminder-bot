import {Pool} from 'pg';
import Cursor from 'pg-cursor';


import {DatabaseClientConfig} from "./models/config";
import {RemindersTableModel, UsersTableModel} from "./models/tables"
import {Moment} from "moment";

class ReminderBotDatabase {
    private pool;

    public constructor(config?: DatabaseClientConfig) {
        this.pool = new Pool({
            host: config?.host,
            port: config?.port,
            user: config?.user,
            password: config?.password,
            database: config?.database,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
            // Client: Client
        })

    }

    async* readRowsGenerator(maxRows: number, cursor: Cursor) {
        let rows;
        while ((rows = await cursor.read(maxRows)).length > 0) {
            yield rows;
        }
    }

    // Reminders
    async addUserReminder(user_id: number, reminder_text: string, reminder_timestamp: Moment, reminder_creation_timestamp: Moment): Promise<number> {
        const res = await this.pool.query(`insert into reminders (user_id, reminder_text, reminder_timestamp,
                                                                  reminder_creation_timestamp)
                                           values ($1, $2, $3, $4) returning id`, [
            user_id,
            reminder_text,
            reminder_timestamp,
            reminder_creation_timestamp
        ]);
        return res.rows[0]?.id;
    }

    async getUserReminders(user_id: number, limit: number = 20): Promise<RemindersTableModel[] | undefined> {
        const result = await this.pool.query(`select *
                                              from reminders
                                              where user_id = $1
                                                  limit $2`, [user_id, limit]);
        return result?.rows;
    }

    /**
     * Возвращает не завершенные напоминания у пользователя
     * **/
    async getUserNotCompleteReminders(user_id: number, limit: number = 20): Promise<RemindersTableModel[] | undefined> {
        const result = await this.pool.query(`select *
                                              from reminders
                                              where user_id = $1
                                                and reminder_timestamp >= now()
                                                  limit $2`, [user_id, limit]);
        return result?.rows;
    }

    async updateReminderTimestamp(reminder_id: number, new_timestamp: Moment) {
        await this.pool.query(`update reminders
                               set reminder_timestamp=$2
                               where id = $1`, [reminder_id, new_timestamp]);
    }

    async getReminder(reminder_id: number): Promise<RemindersTableModel | undefined> {
        const result = await this.pool.query(`select *
                                              from reminders
                                              where id = $1`, [reminder_id]);
        return result?.rows[0];
    }

    async getCountNotCompleteReminders(): Promise<{ count: number }> {
        const result = await this.pool.query(`select count(id)
                                              from reminders
                                              where reminder_timestamp >= now()`)
        return result.rows[0];
    }

    async* getNotCompleteReminders(disable_limit: boolean = false, limit: number = 20, maxRows: number = 10): AsyncGenerator<RemindersTableModel[]> {
        const client = await this.pool.connect();
        let result;
        if (disable_limit) {
            result = client.query(new Cursor(`select *
                                              from reminders
                                              where reminder_timestamp >= now()`))
        } else {
            result = client.query(new Cursor(`select *
                                              from reminders
                                              where reminder_timestamp >= now()
                                                  limit $1`, [limit]))
        }

        for await (const rows of this.readRowsGenerator(maxRows, result)) {
            yield rows;
        }
    }


    // Users
    async getUser(user_id: number): Promise<UsersTableModel | undefined> {
        const result = await this.pool.query(`select *
                                              from users
                                              where user_id = $1`, [user_id]);
        return result.rows[0];
    }

    async updateUser(user_id: number, userData: {
        first_name: string,
        is_premium?: boolean,
        language_code?: string,
        username?: string,
        timezone?: string
    }) {
        await this.pool.query("update users set first_name = $2, is_premium = $3, language_code = $4, username = $5, timezone = $6 where user_id = $1", [
            user_id,
            userData.first_name,
            userData.is_premium,
            userData.language_code,
            userData.username,
            userData.timezone
        ]);
    }

    async addUser(userData: {
        user_id: number,
        first_name: string,
        is_premium?: boolean,
        language_code?: string,
        username?: string,
        timezone?: string
    }) {
        await this.pool.query("insert into users values ($1, $2, $3, $4, $5, $6)", [
            userData.user_id,
            userData.first_name,
            userData.is_premium,
            userData.language_code,
            userData.username,
            userData.timezone,
        ]);
    }
}

export {ReminderBotDatabase};
