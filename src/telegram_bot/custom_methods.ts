import {InlineKeyboardMarkup, Message, ParseMode} from "@grammyjs/types";
import {Context} from "grammy";

export async function replyOrEditMessage(text: string, other: {
    reply_markup?: InlineKeyboardMarkup,
    parse_mode?: ParseMode
}, ctx: Context): Promise<Message.TextMessage | undefined> {
    if (!other.parse_mode) other.parse_mode = "HTML";
    if (ctx.callbackQuery) {
        const editedMessage = await ctx.editMessageText(text, other);
        return editedMessage === true ? undefined : editedMessage;
    }
    return await ctx.reply(text, other);
}