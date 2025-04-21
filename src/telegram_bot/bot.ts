import {Bot, session} from "grammy";
import {MyContext, SessionData, states} from "./types";
import {ReminderBotDatabase} from "../database/reminder_bot_database";
import {addReminderHandler, remindersHandler, settingsHandler, settingsTimezone, startHandler} from "./handlers";
import moment from "moment";
import {ConfigModel} from "../config_dotenv";
import {scheduleAddJobReminder} from "./schedule_reminders";
import {scheduleJobs} from "../schedule_funcs";
import {updateTimezoneRouter} from "./routers/update_timezone_router";
import {addReminderRouter} from "./routers/add_reminder_router";

export class TelegramBot {
    private readonly bot: Bot<MyContext>;
    private readonly myCommands: { command: string, description: string }[];
    private readonly reminderBotDatabase: ReminderBotDatabase;
    private readonly configData: ConfigModel;

    constructor(bot_token: string, reminderBotDatabase: ReminderBotDatabase, configData: ConfigModel) {
        this.bot = new Bot<MyContext>(bot_token);
        this.myCommands = [
            {command: "start", description: "🔄 Обновить бот"},
            {command: "add_reminder", description: "➕ Добавить напоминание"},
        ];
        this.reminderBotDatabase = reminderBotDatabase;
        this.configData = configData;
    }

    private register_middlewares() {
        this.bot.use(session({
            initial: (): SessionData => ({
                bot: this.bot,
                reminderBotDatabase: this.reminderBotDatabase,
                state: states.idle,
                stateData: {}
            })
        }));
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
    }

    private register_routers() {
        this.bot.use(updateTimezoneRouter);
        this.bot.use(addReminderRouter);
    }

    private register_handlers_and_conversations() {
        this.bot.command("start", startHandler);
        this.bot.callbackQuery("start", startHandler);

        this.bot.callbackQuery("settings", settingsHandler);

        this.bot.callbackQuery("reminders", remindersHandler);

        this.bot.callbackQuery("settings:timezone", settingsTimezone);

        this.bot.command("add_reminder", addReminderHandler);
        this.bot.callbackQuery("add_reminder", addReminderHandler);
    }

    async start(): Promise<void> {
        this.register_middlewares();
        this.register_handlers_and_conversations();
        this.register_routers();

        await this.bot.start({
            onStart: async () => {
                console.log("Bot started");

                console.log("Нахожу напоминания пользователей и загружаю в schedule...")
                for await (const reminders of this.reminderBotDatabase.getNotCompleteReminders())
                    for (const reminder of reminders)
                        scheduleAddJobReminder(
                            scheduleJobs,
                            moment(reminder.reminder_timestamp),
                            this.reminderBotDatabase,
                            this.bot,
                            reminder.user_id,
                            reminder.id
                        );

                await this.bot.api.setMyCommands(this.myCommands);
                await this.bot.api.sendMessage(this.configData.ADMIN_ID, "Бот запущен.");
            }
        }).catch(err => {
            console.error(err);
        });
    }
}


