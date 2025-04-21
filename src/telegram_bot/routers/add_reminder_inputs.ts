import {replyOrEditMessage} from "../custom_methods";
import {backToMainMenuKb, confirmAddReminderKb, selectDateKb, selectUTCTimeKb} from "../keyboard";
import {MyContext, states} from "../types";
import {getReminderText} from "../texts";
import {Moment} from "moment";
import {UsersTableModel} from "../../database/models/tables";


async function input_reminder_text(ctx: MyContext) {
    // Инициализирует ожидание ввода текста напоминания
    await replyOrEditMessage("<b>📝 Введите текст напоминания:</b>", {
        reply_markup: backToMainMenuKb,
        parse_mode: "HTML"
    }, ctx);
    ctx.session.state = states.reminderMessageText;
}

async function input_reminder_date(ctx: MyContext) {
    // Инициализирует ожидание ввода даты напоминания
    await replyOrEditMessage(
        "<b>📝 Выберите вариант снизу или введите дату напоминания в формате <code>дд.мм.гггг</code>:</b>",
        {reply_markup: selectDateKb(), parse_mode: "HTML"},
        ctx
    )
    ctx.session.state = states.inputReminderDate;
}

async function input_reminder_time(ctx: MyContext) {
    // Инициализирует ожидание ввода времени напоминания
    await replyOrEditMessage("<b>📝 Введите время напоминания в формате <code>чч:мм</code> (24-hour):</b>", {
        reply_markup: selectUTCTimeKb(),
        parse_mode: "HTML"
    }, ctx)
    ctx.session.state = states.inputReminderTime;
}

async function input_reminder_confirm(ctx: MyContext, reminderDateTime: Moment, userData: UsersTableModel) {
    // Инициализирует ожидание ввода подтверждения создания напоминания
    await replyOrEditMessage(
        getReminderText(reminderDateTime, ctx.session.stateData.reminderMessageText, userData.timezone!),
        {parse_mode: "HTML", reply_markup: confirmAddReminderKb},
        ctx
    );

    ctx.session.state = states.inputReminderConfirm;
}

export {input_reminder_text, input_reminder_date, input_reminder_time, input_reminder_confirm};
