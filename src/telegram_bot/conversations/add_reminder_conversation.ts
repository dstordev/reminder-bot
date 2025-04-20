import {MyContext, states} from "../types";
import {Router} from "@grammyjs/router";
import {replyOrEditMessage} from "../custom_methods";
import {backToMainMenuKb, confirmAddReminderKb, selectDateKb, selectUTCTimeKb} from "../keyboard";
import moment from "moment/moment";
import {UTCOffsetToNumber} from "../../utc_offset";
import {getReminderText} from "../texts";
import {scheduleAddJobReminder} from "../schedule_reminders";
import {scheduleJobs} from "../../schedule_funcs";

export const addReminderRouter = new Router<MyContext>((ctx) => ctx.session.state);

export async function reminderAddConversation(ctx: MyContext) {
    await replyOrEditMessage("<b>📝 Введите текст напоминания:</b>", {
        reply_markup: backToMainMenuKb,
        parse_mode: "HTML"
    }, ctx);
    ctx.session.state = states.reminderMessageText;
}

const reminderMessageTextRoute = addReminderRouter.route(states.reminderMessageText);
reminderMessageTextRoute.on("message:text", async (ctx) => {
    ctx.session.stateData.reminderMessageText = ctx.message.text;

    // Ждем ввод даты
    await replyOrEditMessage("<b>📝 Выберите вариант снизу или введите дату напоминания в формате <code>дд.мм.гггг</code>:</b>", {
        reply_markup: selectDateKb(),
        parse_mode: "HTML"
    }, ctx)
    ctx.session.state = states.inputReminderDate;
});

const inputReminderDateRoute = addReminderRouter.route(states.inputReminderDate);
inputReminderDateRoute.on(["message:text", "callback_query:data"], async (ctx) => {
    const regMatcher = /(\d{2})\.(\d{2})\.(\d{4})/;
    let parsedDate: RegExpMatchArray | null;

    let year: number, month: number, day: number;

    if (ctx.callbackQuery) {
        const selectTimeAddParams = ctx.callbackQuery.data.split(":");
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
    } else if (ctx.message) {
        parsedDate = ctx.message!.text.match(regMatcher);
        if (!parsedDate) {
            await ctx.reply("<b>🤚 Введеная вами дата не соответствует заданому формату...</b>", {parse_mode: "HTML"});
            return;
        }
        year = parseInt(parsedDate![3]);
        month = parseInt(parsedDate![2]) - 1;
        day = parseInt(parsedDate![1]);
    } else {
        return;
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

    ctx.session.stateData.reminderDate = reminderDate;

    await replyOrEditMessage("<b>📝 Введите время напоминания в формате <code>чч:мм</code> (24-hour):</b>", {
        reply_markup: selectUTCTimeKb(),
        parse_mode: "HTML"
    }, ctx)
    ctx.session.state = states.inputReminderTime;
})

const inputReminderTimeRoute = addReminderRouter.route(states.inputReminderTime);
inputReminderTimeRoute.on(["message:text", "callback_query:data"], async (ctx) => {
    const from_user_id = ctx.from!.id;
    const userData = await ctx.session.reminderBotDatabase.getUser(from_user_id);
    let hours: number, minutes: number, seconds: number;

    // Если нажал inline кнопку
    if (ctx.callbackQuery) {
        const selectTimeAddParams = ctx.callbackQuery.data.split(":");
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
        let enteredTimeWithTimezone = ctx.message.text.match(/(\d{2}):(\d{2})/);
        if (!enteredTimeWithTimezone) {
            await ctx.reply("<b>🤚 Введеное вами время не соответствует заданому формату...</b>", {parse_mode: "HTML"});
            return;
        }
        hours = parseInt(enteredTimeWithTimezone[1]);
        minutes = parseInt(enteredTimeWithTimezone[2]);
        seconds = 0;
    }

    const reminderDateTime = moment({
        year: ctx.session.stateData.reminderDate.year(),
        month: ctx.session.stateData.reminderDate.month(),
        day: ctx.session.stateData.reminderDate.date(),
        hours: hours,
        minutes: minutes,
        seconds: seconds
    }).utcOffset(UTCOffsetToNumber(userData!.timezone!));
    ctx.session.stateData.reminderDateTime = reminderDateTime;

    await replyOrEditMessage(getReminderText(reminderDateTime, ctx.session.stateData.reminderMessageText, userData?.timezone!), {
        parse_mode: "HTML",
        reply_markup: confirmAddReminderKb
    }, ctx);

    ctx.session.state = states.inputReminderConfirm;
})

const inputReminderConfirmRoute = addReminderRouter.route(states.inputReminderConfirm);
inputReminderConfirmRoute.callbackQuery(/addReminder:(\w{2,3})/, async (ctx) => {
    const from_user_id = ctx.from.id;
    const userData = await ctx.session.reminderBotDatabase.getUser(from_user_id);

    let reminderConfirm;
    if (ctx.callbackQuery.data == "addReminder:no")
        reminderConfirm = false;
    else if (ctx.callbackQuery.data == "addReminder:yes")
        reminderConfirm = true;
    else
        throw new Error();

    // Создаем напоминание в БД
    const reminder_id = await ctx.session.reminderBotDatabase.addUserReminder(
        from_user_id,
        ctx.session.stateData.reminderMessageText,
        ctx.session.stateData.reminderDateTime,
        moment()
    );
    // Регистрируем напоминание
    scheduleAddJobReminder(
        scheduleJobs,
        ctx.session.stateData.reminderDateTime,
        ctx.session.reminderBotDatabase,
        ctx.session.bot,
        from_user_id,
        reminder_id
    );

    await replyOrEditMessage(
        getReminderText(ctx.session.stateData.reminderDateTime, ctx.session.stateData.reminderMessageText, userData?.timezone!, reminderConfirm),
        {parse_mode: "HTML"},
        ctx
    );
    ctx.session.state = states.idle;
})
