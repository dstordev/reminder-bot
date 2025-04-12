import moment, {Moment} from "moment/moment";
import {ReminderBotDatabase} from "../database/reminder_bot_database";
import {Bot} from "grammy";
import {ConversationFlavor} from "@grammyjs/conversations";
import {MyContext} from "./types";
import {UTCOffsetToNumber} from "../utc_offset";
import {getNotificationText} from "./texts";
import {html_escape} from "../html";
import {ScheduleJobs} from "../schedule_funcs";

export function scheduleAddJobReminder(scheduleJobs: ScheduleJobs, date: Moment, reminderBotDatabase: ReminderBotDatabase, bot: Bot<ConversationFlavor<MyContext>>, userId: number, reminderId: number): number {
    scheduleJobs.addJob(date, async () => {
        const reminderData = await reminderBotDatabase.getReminder(reminderId);
        const userData = await reminderBotDatabase.getUser(userId);
        if (!reminderData) {
            return await bot.api.sendMessage(
                userId,
                "Не удалось отправить уведомление о напоминании т.к. получен неизвестный ответ от БД",
                {parse_mode: "HTML"}
            );
        }
        const reminderDateTime = moment(reminderData.reminder_timestamp).utcOffset(UTCOffsetToNumber(userData?.timezone!));
        await bot.api.sendMessage(
            userId,
            getNotificationText(html_escape(reminderData.reminder_text), reminderDateTime),
            {parse_mode: "HTML"}
        );
    }, reminderId)
    return reminderId;
}