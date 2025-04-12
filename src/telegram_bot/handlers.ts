import {replyOrEditMessage} from "./custom_methods";
import {backToMainMenuKb, settingsKb, startKb} from "./keyboard";
import {settingsText} from "./texts";
import {CallbackQueryContext, CommandContext} from "grammy";
import {ConversationFlavor} from "@grammyjs/conversations";
import {MyContext} from "./types";

type handlerCtx =
    CommandContext<ConversationFlavor<MyContext>>
    | CallbackQueryContext<ConversationFlavor<MyContext>>
    | ConversationFlavor<MyContext>;


async function startHandler(ctx: handlerCtx) {
    await ctx.conversation.exitAll();
    await replyOrEditMessage("<b>🗒 Главное меню</b>", {reply_markup: startKb, parse_mode: "HTML"}, ctx)
}

async function settingsHandler(ctx: handlerCtx) {
    await ctx.conversation.exitAll();
    const userData = await ctx.session.reminderBotDatabase.getUser(ctx.from?.id!);
    await replyOrEditMessage(settingsText(userData?.timezone), {reply_markup: settingsKb}, ctx);
}

async function settingsTimezone(ctx: handlerCtx) {
    await ctx.conversation.enter("updateTimezoneConversation");
}

async function addReminderHandler(ctx: handlerCtx) {
    await ctx.conversation.enter("reminderAddConversation");
}

async function remindersHandler(ctx: handlerCtx) {
    await replyOrEditMessage("🗒 Напоминания", {reply_markup: backToMainMenuKb}, ctx);
}

export {startHandler, settingsHandler, addReminderHandler, settingsTimezone, remindersHandler};
