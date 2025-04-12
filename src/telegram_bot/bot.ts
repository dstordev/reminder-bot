import {Bot, session} from "grammy";
import {MyContext} from "./types";
import {ConversationFlavor, conversations, createConversation} from "@grammyjs/conversations";
import {ReminderBotDatabase} from "../database/reminder_bot_database";
import {reminderAddConversation} from "./add_reminder_conversation/conversation";
import {updateTimezoneConversation} from "./update_timezone_conversation";
import {addReminderHandler, remindersHandler, settingsHandler, settingsTimezone, startHandler} from "./handlers";
import moment from "moment";
import {ConfigModel} from "../config_dotenv";
import {scheduleAddJobReminder} from "./schedule_reminders";
import {scheduleJobs} from "../schedule_funcs";


export class TelegramBot {
    private readonly bot: Bot<ConversationFlavor<MyContext>>;
    private readonly myCommands: { command: string, description: string }[];
    private readonly reminderBotDatabase: ReminderBotDatabase;
    private readonly configData: ConfigModel;

    constructor(bot_token: string, reminderBotDatabase: ReminderBotDatabase, configData: ConfigModel) {
        this.bot = new Bot<ConversationFlavor<MyContext>>(bot_token);
        this.myCommands = [
            {command: "start", description: "🔄 Обновить бот"},
            {command: "add_reminder", description: "➕ Добавить напоминание"},
        ];
        this.reminderBotDatabase = reminderBotDatabase;
        this.configData = configData;
    }

    private register_middlewares() {
        this.bot.use(conversations());
        this.bot.use(session({initial: () => ({bot: this.bot, reminderBotDatabase: this.reminderBotDatabase})}));
        this.bot.use(async (ctx, next) => {
            if (!ctx.from)
                return await next();
            const user_id = ctx.from.id;

            const result = await ctx.session.reminderBotDatabase.getUser(user_id);
            if (!result) {
                await ctx.session.reminderBotDatabase.addUser({
                    user_id: user_id,
                    first_name: ctx.from.first_name,
                    is_premium: ctx.from.is_premium,
                    username: ctx.from.username,
                    language_code: ctx.from.language_code,
                    timezone: undefined
                });
            }
            await next();
        });
        this.bot.use(createConversation(reminderAddConversation));
        this.bot.use(createConversation(updateTimezoneConversation));
    }

    private register_handlers() {
        this.bot.command("start", startHandler);
        this.bot.callbackQuery("start", startHandler)

        this.bot.command("add_reminder", addReminderHandler)
        this.bot.callbackQuery("add_reminder", addReminderHandler)

        this.bot.callbackQuery("settings", settingsHandler)

        this.bot.callbackQuery("settings:timezone", settingsTimezone);

        this.bot.callbackQuery("reminders", remindersHandler);
    }

    async start(): Promise<void> {
        this.register_middlewares();
        this.register_handlers();

        await this.bot.start({
            onStart: async (_) => {
                console.log("Нахожу напоминания пользователей и загружаю в schedule...")
                for await (const reminders of this.reminderBotDatabase.getNotCompleteReminders()) {
                    for (const reminder of reminders) {
                        scheduleAddJobReminder(scheduleJobs, moment(reminder.reminder_timestamp), this.reminderBotDatabase, this.bot, reminder.user_id, reminder.id);
                    }
                }

                console.log("Bot started");

                await this.bot.api.setMyCommands(this.myCommands);
                await this.bot.api.sendMessage(this.configData.ADMIN_ID, "Бот запущен.");
            }
        }).catch(err => {
            console.error(err);
        });
    }
}


