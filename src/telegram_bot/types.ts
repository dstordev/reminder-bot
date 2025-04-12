import {Bot, Context, SessionFlavor} from "grammy";
import {ReminderBotDatabase} from "../database/reminder_bot_database";
import {Conversation, ConversationFlavor} from "@grammyjs/conversations";

interface SessionData {
    reminderBotDatabase: ReminderBotDatabase;
    bot: Bot<ConversationFlavor<MyContext>>;
}

type MyContext = Context & SessionFlavor<SessionData>;
type MyConversation = Conversation<ConversationFlavor<MyContext>>;

export {SessionData, MyContext, MyConversation};
