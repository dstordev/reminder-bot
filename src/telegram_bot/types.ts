import {Bot, Context, SessionFlavor} from "grammy";
import {ReminderBotDatabase} from "../database/reminder_bot_database";

const states = {
    idle: "idle",
    updateTimezone: "updateTimezone",
    reminderMessageText: "reminderMessageText",
    inputReminderDate: "inputReminderDate",
    inputReminderTime: "inputReminderTime",
    inputReminderConfirm: "inputReminderConfirm"
};

interface SessionData {
    state: string;
    stateData: {
        [key: string]: any;
    };
    reminderBotDatabase: ReminderBotDatabase;
    bot: Bot<MyContext>;
}

type MyContext = Context & SessionFlavor<SessionData>;

export {SessionData, MyContext, states};
