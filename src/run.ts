import {TelegramBot} from "./telegram_bot/bot";
import {ReminderBotDatabase} from "./database/reminder_bot_database";
import {getConfig} from "./config_dotenv";

function run() {
    const configData = getConfig();
    if (!configData) {
        return console.warn("No configuration found.");
    }

    const reminderBotDatabase = new ReminderBotDatabase({
        user: configData.POSTGRES_USER,
        password: configData.POSTGRES_PASSWORD,
        host: configData.POSTGRES_HOST,
        database: configData.POSTGRES_DATABASE
    });
    const telegram_bot = new TelegramBot(configData.BOT_TOKEN, reminderBotDatabase, configData);
    telegram_bot.start();
}

run();
