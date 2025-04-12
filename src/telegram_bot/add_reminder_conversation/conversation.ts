import {Context} from "grammy";
import {getReminderText} from "../texts";
import {InputConversations} from "./input_conversations";
import {replyOrEditMessage} from "../custom_methods";

import {MyConversation} from "../types";
import {updateTimezoneConversation} from "../update_timezone_conversation";
import moment from "moment";
import {scheduleJobs} from "../../schedule_funcs";
import {scheduleAddJobReminder} from "../schedule_reminders";


async function reminderAddConversation(conversation: MyConversation, ctx: Context) {
    const from_user_id: number = ctx.from?.id!;

    let userData = await conversation.external(async ctx1 => await ctx1.session.reminderBotDatabase.getUser(from_user_id))
    if (!userData) {
        return await ctx.reply("🤚 Попробуйте позже...");
    }
    if (!userData.timezone) {
        await ctx.answerCallbackQuery({
            text: "🤚 Установите временную зону для создания напоминания.",
            show_alert: true,
        });
        await updateTimezoneConversation(conversation, ctx);
        return;
    }

    const inputConversations = new InputConversations(conversation);

    // Получаем текст напоминания от пользователя
    const inputReminderTextResult = await inputConversations.inputReminderText(ctx);
    const {reminderMessageText} = inputReminderTextResult;

    // Получаем дату напоминания
    const inputReminderDateResult = await inputConversations.inputReminderDate(inputReminderTextResult.context);
    if (inputReminderDateResult === undefined) {
        return;
    }
    const {reminderDate} = inputReminderDateResult;

    // Получаем время напоминания
    const inputReminderTimeResult = await inputConversations.inputReminderTime(
        reminderDate, userData, inputReminderDateResult.context);
    if (inputReminderTimeResult === undefined) {
        return;
    }
    const {reminderDateTime} = inputReminderTimeResult;

    userData = await conversation.external(async ctx1 => await ctx1.session.reminderBotDatabase.getUser(from_user_id));
    if (!userData) {
        return;
    }
    const reminderDataTimezone = userData.timezone?.replace("UTC", "");
    if (!reminderDataTimezone) {
        return;
    }

    if (reminderDateTime < moment()) { // Если дата меньше текущей
        return await ctx.reply("🤚 Введеная вами дата меньше текущей...")
    }

    // Подтверждение создания напоминания
    const inputReminderConfirmResult = await inputConversations.inputReminderConfirm(
        inputReminderTimeResult.context,
        reminderDateTime,
        reminderMessageText
    );
    if (inputReminderConfirmResult === undefined) {
        return;
    }
    const {reminderConfirm} = inputReminderConfirmResult;

    if (reminderConfirm) {
        // Создаем напоминание в БД
        await conversation.external(async ctx => {
            const reminder_id = await ctx.session.reminderBotDatabase.addUserReminder(
                from_user_id,
                reminderMessageText,
                reminderDateTime,
                moment()
            );
            // Регистрируем напоминание
            scheduleAddJobReminder(
                scheduleJobs,
                reminderDateTime,
                ctx.session.reminderBotDatabase,
                ctx.session.bot,
                from_user_id,
                reminder_id
            );
        })
    }

    await replyOrEditMessage(
        getReminderText(reminderDateTime, reminderMessageText, userData?.timezone!, reminderConfirm),
        {parse_mode: "HTML"},
        inputReminderConfirmResult.context
    );
}

export {reminderAddConversation};
