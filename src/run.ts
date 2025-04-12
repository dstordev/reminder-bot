import {TelegramBot} from "./telegram_bot/bot";
import {ReminderBotDatabase} from "./database/reminder_bot_database";
import {getConfig} from "./config_dotenv";
import {createTables} from "./database/create_tables";

async function run() {
    const configData = getConfig();
    if (!configData) {
        return console.warn("No configuration found.");
    }

    const dbConfig = {
        user: configData.POSTGRES_USER,
        password: configData.POSTGRES_PASSWORD,
        host: configData.POSTGRES_HOST,
        database: configData.POSTGRES_DATABASE
    };
    await createTables("create_tables.sql", dbConfig);
    const reminderBotDatabase = new ReminderBotDatabase(dbConfig);
    const telegram_bot = new TelegramBot(configData.BOT_TOKEN, reminderBotDatabase, configData);
    await telegram_bot.start();
}

run();
