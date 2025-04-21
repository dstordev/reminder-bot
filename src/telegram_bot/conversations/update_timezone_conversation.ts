import {MyContext, states} from "../types";
import {replyOrEditMessage} from "../custom_methods";
import {selectTimezoneKb} from "../keyboard";
import moment from "moment";
import {UTCOffsetToNumber} from "../../utc_offset";
import {scheduleAddJobReminder} from "../schedule_reminders";
import {scheduleJobs} from "../../schedule_funcs";
import {Router} from "@grammyjs/router";
import {settingsHandler} from "../handlers";

export const updateTimezoneRouter = new Router<MyContext>((ctx) => ctx.session.state);
const updateTimezoneRoute = updateTimezoneRouter.route(states.updateTimezone);

async function updateTimezoneConversation(ctx: MyContext) {
    const from_user_id: number = ctx.from!.id;
    const userData = await ctx.session.reminderBotDatabase.getUser(from_user_id);
    const currentTimezone = userData!.timezone;

    await replyOrEditMessage("<b>📝 Выберите свою временную зону:</b>", {reply_markup: selectTimezoneKb(currentTimezone)}, ctx);

    // Смена состояния
    ctx.session.state = states.updateTimezone;
}

updateTimezoneRoute.callbackQuery(/settings:timezone:(UTC[+-]\d{2}:\d{2})/, async (ctx) => {
    const from_user_id = ctx.from.id;

    const userData = await ctx.session.reminderBotDatabase.getUser(from_user_id);
    const currentTimezone = userData!.timezone;

    const selectedTimezone = ctx.callbackQuery.data.split("settings:timezone:")[1];
    await ctx.session.reminderBotDatabase.updateUser(from_user_id, {
        first_name: ctx.from?.first_name!,
        is_premium: ctx.from?.is_premium,
        language_code: ctx.from?.language_code,
        username: ctx.from?.username,
        timezone: selectedTimezone
    });

    const reminders = await ctx.session.reminderBotDatabase.getUserNotCompleteReminders(from_user_id);
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

            await ctx.session.reminderBotDatabase.updateReminderTimestamp(reminder.id, new_timestamp);

            scheduleAddJobReminder(
                scheduleJobs,
                new_timestamp,
                ctx.session.reminderBotDatabase,
                ctx.session.bot,
                reminder.user_id,
                reminder.id
            );
        }
    }

    await ctx.answerCallbackQuery("✅ Сохранено");
    await settingsHandler(ctx);
})

export {updateTimezoneConversation};
