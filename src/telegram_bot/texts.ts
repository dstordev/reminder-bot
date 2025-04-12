import {html_escape} from "../html";
import {Moment} from "moment";

function myFormatDateMoment(date: Moment): string {
    // example: 9.4.2025
    return `${date.date()}.${date.month() + 1}.${date.year()}`;
}

function myFormatTimeMoment(date: Moment): string {
    // example: 15:34
    return `${date.hours()}:${date.minutes()}:${date.seconds()}`;
}

function getReminderText(reminderDateTime: Moment, reminderText: string, userTimezone: string, completeReminder?: boolean) {
    if (completeReminder === false) {
        return `<b>❌ Отменил создание напоминания
🗒 Напоминание выглядит следующим образом:

🗓️ Дата: <code>${myFormatDateMoment(reminderDateTime)}</code>
⏳️ Время: <code>${myFormatTimeMoment(reminderDateTime)}</code>
💬 Текст: <code>${html_escape(reminderText)}</code></b>`
    } else if (completeReminder === true) {
        return `<b>✅ Создал напоминание
🗒 Напоминание выглядит следующим образом:

🗓️ Дата: <code>${myFormatDateMoment(reminderDateTime)}</code>
⏳️ Время: <code>${myFormatTimeMoment(reminderDateTime)}</code>
💬 Текст: <code>${html_escape(reminderText)}</code></b>`
    } else {
        return `<b>🗒 Напоминание выглядит следующим образом:

🗓️ Дата: <code>${myFormatDateMoment(reminderDateTime)}</code>
⏳️ Время: <code>${myFormatTimeMoment(reminderDateTime)}</code>
💬 Текст: <code>${html_escape(reminderText)}</code>

Всё верно?</b>`
    }
}

function getNotificationText(reminderText: string, reminderTimestamp: Moment) {
    return `<b>📌 Напоминание.</b>
<blockquote>${html_escape(reminderText)}</blockquote>

⏳ ${myFormatDateMoment(reminderTimestamp)} ${myFormatTimeMoment(reminderTimestamp)}`;
}


function settingsText(timezone?: string) {
    let time_zone_text = "Не указан";

    if (timezone !== undefined && timezone !== null)
        time_zone_text = `${timezone}`;

    return `<b>⚙ Настройки

🕰️ Часовой пояс: <code>${time_zone_text}</code>
</b>`
}

export {getReminderText, getNotificationText, settingsText};

