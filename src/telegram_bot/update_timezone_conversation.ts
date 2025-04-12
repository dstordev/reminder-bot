import {Context} from "grammy";
import {MyConversation} from "./types";
import {replyOrEditMessage} from "./custom_methods";
import {selectTimezoneKb} from "./keyboard";
import {settingsHandler} from "./handlers";
import moment from "moment";
import {UTCOffsetToNumber} from "../utc_offset";
import {scheduleAddJobReminder} from "./schedule_reminders";
import {scheduleJobs} from "../schedule_funcs";


async function updateTimezoneConversation(conversation: MyConversation, ctx: Context): Promise<string | undefined> {
    if (!ctx.from) {
        return;
    }
    const from_user_id: number = ctx.from.id;
    const currentTimezone = await conversation.external(async ctx => {
        const userData = await ctx.session.reminderBotDatabase.getUser(from_user_id);
        if (!userData) {
            return;
        }
        return userData.timezone;
    });
    await replyOrEditMessage("<b>📝 Выберите свою временную зону:</b>", {reply_markup: selectTimezoneKb(currentTimezone)}, ctx);
    const callbackSelectedTimezone = await conversation.waitForCallbackQuery(/settings:timezone:(UTC[+-]\d{2}:\d{2})/);
    const selectedTimezone = callbackSelectedTimezone.callbackQuery.data.split("settings:timezone:")[1];
    await conversation.external(async ctx1 => {
        await ctx1.session.reminderBotDatabase.updateUser(from_user_id, {
            first_name: ctx.from?.first_name!,
            is_premium: ctx.from?.is_premium,
            language_code: ctx.from?.language_code,
            username: ctx.from?.username,
            timezone: selectedTimezone
        });


        const reminders = await ctx1.session.reminderBotDatabase.getUserNotCompleteReminders(from_user_id);
        if (reminders) {
            for (const reminder of reminders) {
                scheduleJobs.deleteJob(reminder.id);
                // Вычитаем разницу нового и старого смещения X = Z(new) - Z(old)
                const diffOffset = UTCOffsetToNumber(selectedTimezone!) - UTCOffsetToNumber(currentTimezone!);

                let new_timestamp;
                if (diffOffset < 0) {
                    new_timestamp = moment(reminder.reminder_timestamp).utc().add(-diffOffset, "hours");
                } else {
                    new_timestamp = moment(reminder.reminder_timestamp).utc().subtract(diffOffset, "hours");
                }

                await ctx1.session.reminderBotDatabase.updateReminderTimestamp(reminder.id, new_timestamp);

                scheduleAddJobReminder(scheduleJobs, new_timestamp, ctx1.session.reminderBotDatabase, ctx1.session.bot, reminder.user_id, reminder.id);
            }
        }

        await ctx1.answerCallbackQuery("✅ Сохранено");
        await settingsHandler(ctx1);
    });


    return selectedTimezone;
}

export {updateTimezoneConversation};
