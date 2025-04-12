import {Context} from "grammy";
import moment, {Moment} from "moment";
import {MyConversation} from "../types";
import {replyOrEditMessage} from "../custom_methods";
import {backToMainMenuKb, confirmAddReminderKb, selectDateKb, selectUTCTimeKb} from "../keyboard";
import {UsersTableModel} from "../../database/models/tables";
import {UTCOffsetToNumber} from "../../utc_offset";
import {getReminderText} from "../texts";


class InputConversations {
    private conversation;

    constructor(conversation: MyConversation) {
        this.conversation = conversation;
    }

    async inputReminderText(ctx: Context): Promise<{ reminderMessageText: string, context: Context }> {
        // Получаем текст напоминания от пользователя
        await replyOrEditMessage("<b>📝 Введите текст напоминания:</b>", {
            reply_markup: backToMainMenuKb,
            parse_mode: "HTML"
        }, ctx);
        const context = await this.conversation.waitFor("message:text");
        return {reminderMessageText: context.message.text, context};
    }

    /**
     * Функция запрашивает у пользователя ввод даты после чего возвращает объект вписанной даты
     * **/
    async inputReminderDate(ctx: Context): Promise<{ reminderDate: Moment, context: Context } | undefined> {
        const regMatcher = /(\d{2})\.(\d{2})\.(\d{4})/;

        // Запрашиваем ввод пользователя
        await replyOrEditMessage("<b>📝 Выберите вариант снизу или введите дату напоминания в формате <code>дд.мм.гггг</code>:</b>", {
            reply_markup: selectDateKb(),
            parse_mode: "HTML"
        }, ctx)
        const context = await this.conversation.waitFor(["message:text", "callback_query:data"]);
        let parsedDate: RegExpMatchArray | null;

        let year: number, month: number, day: number;

        if (context.callbackQuery) {
            const selectTimeAddParams = context.callbackQuery.data.split(":");
            const amount = parseInt(selectTimeAddParams[1]);
            const unit = selectTimeAddParams[2];

            if (unit === "days") {
                const momentPlus1Min = moment().add(amount, unit);
                year = momentPlus1Min.year();
                month = momentPlus1Min.month();
                day = momentPlus1Min.date();
            } else {
                throw Error("Unit не равняется `days` или `seconds`");
            }
        } else {
            parsedDate = context.message.text.match(regMatcher);
            if (!parsedDate) {
                await ctx.reply("<b>🤚 Введеная вами дата не соответствует заданому формату...</b>", {parse_mode: "HTML"});
                return;
            }
            year = parseInt(parsedDate![3]);
            month = parseInt(parsedDate![2]) - 1;
            day = parseInt(parsedDate![1]);
        }

        const reminderDate = moment({
            year: year,
            month: month,
            day: day,
        });

        const nowDateTime = moment();
        if (reminderDate.isBefore(nowDateTime, "day")) {
            await ctx.reply("<b>🤚 Введеная вами дата меньше текущей...</b>", {parse_mode: "HTML"});
            return;
        }

        const diffTime = reminderDate.toDate().getTime() - nowDateTime.toDate().getTime();
        const daysDifference = Math.floor(diffTime / 1000 / 60 / 60 / 24);

        if (daysDifference > 60) {
            await ctx.reply("<b>🤚 Вы не можете добавить напоминание больше чем на 60 дней вперед...</b>", {parse_mode: "HTML"})
            return;
        }

        return {reminderDate, context};
    }

    /**
     * Функция запрашивает у пользователя ввод времени после чего возвращает переданную дату и время в типе данных Moment
     * **/
    async inputReminderTime(dateTime: Moment, userData: UsersTableModel, ctx: Context): Promise<{
        reminderDateTime: Moment, context: Context
    } | undefined> {
        // Запрашиваем ввод пользователя
        await replyOrEditMessage("<b>📝 Введите время напоминания в формате <code>чч:мм</code> (24-hour):</b>", {
            reply_markup: selectUTCTimeKb(),
            parse_mode: "HTML"
        }, ctx)
        const messageOrCallback = await this.conversation.waitFor(["message:text", "callback_query:data"]);

        let hours: number, minutes: number, seconds: number;

        // Если нажал inline кнопку
        if (messageOrCallback.callbackQuery) {
            const selectTimeAddParams = messageOrCallback.callbackQuery.data.split(":");
            const amount = parseInt(selectTimeAddParams[1]);
            const unit = selectTimeAddParams[2];

            if (unit === "minutes" || unit === "seconds") {
                const momentPlus1Min = moment().add(amount, unit);
                hours = momentPlus1Min.hours();
                minutes = momentPlus1Min.minutes();
                seconds = momentPlus1Min.seconds();
            } else {
                throw Error("Unit не равняется `minutes` или `seconds`");
            }
        }
        // Или если ввел время текстом
        else {
            let enteredTimeWithTimezone = messageOrCallback.message.text.match(/(\d{2}):(\d{2})/);
            if (!enteredTimeWithTimezone) {
                await ctx.reply("<b>🤚 Введеное вами время не соответствует заданому формату...</b>", {parse_mode: "HTML"});
                return;
            }
            hours = parseInt(enteredTimeWithTimezone[1]);
            minutes = parseInt(enteredTimeWithTimezone[2]);
            seconds = 0;
        }

        const reminderDateTime = moment({
            year: dateTime.year(),
            month: dateTime.month(),
            day: dateTime.date(),
            hours: hours,
            minutes: minutes,
            seconds: seconds
        }).utcOffset(UTCOffsetToNumber(userData.timezone!));


        // if (reminderTimeData.hours > 23 || reminderTimeData.minutes < 0) {
        //     await ctx.reply("<b>🤚 Введеное вами время не соответствует заданому формату...</b>", {parse_mode: "HTML"});
        //     return;
        // }
        // if (reminderTimeData.minutes > 59 || reminderTimeData.minutes < 0) {
        //     await ctx.reply("<b>🤚 Введеное вами время не соответствует заданому формату...</b>", {parse_mode: "HTML"});
        //     return;sud
        // }
        return {reminderDateTime, context: messageOrCallback};
    }

    async inputReminderConfirm(ctx: Context, reminderDateTime: Moment, reminderMessageText: string): Promise<{
        reminderConfirm: boolean,
        context: Context
    } | undefined> {
        const from_user_id = ctx.from?.id!;
        const userData = await this.conversation.external(async ctx => await ctx.session.reminderBotDatabase.getUser(from_user_id));

        // Подтверждение создания напоминания
        await replyOrEditMessage(getReminderText(reminderDateTime, reminderMessageText, userData?.timezone!), {
            parse_mode: "HTML",
            reply_markup: confirmAddReminderKb
        }, ctx);

        const addReminderCallback = await this.conversation.waitForCallbackQuery(/addReminder:(\w{2,3})/);

        let reminderConfirm;
        if (addReminderCallback.callbackQuery.data == "addReminder:no")
            reminderConfirm = false;
        else if (addReminderCallback.callbackQuery.data == "addReminder:yes")
            reminderConfirm = true;
        else
            throw new Error()

        return {reminderConfirm: reminderConfirm, context: addReminderCallback};
    }
}


export {InputConversations};
