import {replyOrEditMessage} from "./custom_methods";
import {backToMainMenuKb, settingsKb, startKb} from "./keyboard";
import {settingsText} from "./texts";
import {MyContext, states} from "./types";
import {updateTimezoneConversation} from "./conversations/update_timezone_conversation";
import {reminderAddConversation} from "./conversations/add_reminder_conversation";

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
    await updateTimezoneConversation(ctx);
}

async function addReminderHandler(ctx: MyContext) {
    await reminderAddConversation(ctx);
}

async function remindersHandler(ctx: MyContext) {
    await replyOrEditMessage("🗒 Напоминания", {reply_markup: backToMainMenuKb}, ctx);
}

export {startHandler, settingsHandler, addReminderHandler, settingsTimezone, remindersHandler};
