import {replyOrEditMessage} from "./custom_methods";
import {backToMainMenuKb, settingsKb, startKb} from "./keyboard";
import {settingsText} from "./texts";
import {MyContext, states} from "./types";
import {input_reminder_text} from "./routers/add_reminder/add_reminder_inputs";
import {input_timezone} from "./routers/update_timezone/update_timezone_inputs";

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
    await input_timezone(ctx);
}

async function addReminderHandler(ctx: MyContext) {
    await input_reminder_text(ctx);
}

async function remindersHandler(ctx: MyContext) {
    await replyOrEditMessage("🗒 Напоминания", {reply_markup: backToMainMenuKb}, ctx);
}

export {startHandler, settingsHandler, addReminderHandler, settingsTimezone, remindersHandler};
