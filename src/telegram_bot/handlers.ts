import {replyOrEditMessage} from "./custom_methods";
import {backToMainMenuKb, selectTimezoneKb, settingsKb, startKb} from "./keyboard";
import {settingsText} from "./texts";
import {MyContext, states} from "./types";
import {reminderAddConversation} from "./routers/add_reminder_router";

async function startHandler(ctx: MyContext) {
    ctx.session.state = states.idle;
    await replyOrEditMessage("<b>🗒 Главное меню</b>", {reply_markup: startKb, parse_mode: "HTML"}, ctx)
}

async function settingsHandler(ctx: MyContext) {
    ctx.session.state = states.idle;
    const userData = await ctx.session.reminderBotDatabase.getUser(ctx.from!.id);
    await replyOrEditMessage(settingsText(userData?.timezone), {reply_markup: settingsKb}, ctx);
}

async function settingsTimezone(ctx: MyContext) {
    const from_user_id: number = ctx.from!.id;
    const userData = await ctx.session.reminderBotDatabase.getUser(from_user_id);
    const currentTimezone = userData!.timezone;

    await replyOrEditMessage(
        "<b>📝 Выберите свою временную зону:</b>",
        {reply_markup: selectTimezoneKb(currentTimezone)},
        ctx
    );

    // Смена состояния
    ctx.session.state = states.updateTimezone;
}

async function addReminderHandler(ctx: MyContext) {
    await reminderAddConversation(ctx);
}

async function remindersHandler(ctx: MyContext) {
    await replyOrEditMessage("🗒 Напоминания", {reply_markup: backToMainMenuKb}, ctx);
}

export {startHandler, settingsHandler, addReminderHandler, settingsTimezone, remindersHandler};
