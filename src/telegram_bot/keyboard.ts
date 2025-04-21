import {InlineKeyboard} from "grammy";
import {UTC_OFFSETS} from "../utc_offset";


const startKb = new InlineKeyboard()
    .text("➕ Напоминание", "add_reminder")
    // .row()
    // .text("🗒 Напоминания", "reminders")
    .row()
    .text("⚙ Настройки", "settings");

const settingsKb = new InlineKeyboard()
    .text("🕰️ Часовой пояс", "settings:timezone")
    .row()
    .text("◀️ Главное меню", "start");

function selectTimezoneKb(selectedTimezone?: string) {
    const inlineKb = new InlineKeyboard();

    let i = 0;
    for (const timezone of UTC_OFFSETS) {
        if (i % 2 === 0) {
            inlineKb.row();
        }
        if (selectedTimezone == timezone) {
            inlineKb.text(`☑️ ${timezone}`, `settings:timezone:${timezone}`);
        } else {
            inlineKb.text(`${timezone}`, `settings:timezone:${timezone}`);
        }
        i++;
    }

    inlineKb.row();
    inlineKb.webApp("🌐 Узнать свое смещение", "https://www.timezonevisualizer.com/my-timezone");
    inlineKb.row();
    inlineKb.text("◀️ Настройки", "settings")

    return inlineKb;
}

const backToMainMenuKb = new InlineKeyboard()
    .text("◀️ Главное меню", "start");
const confirmAddReminderKb = new InlineKeyboard()
    .text("✅", "addReminder:yes")
    .text("❌", "addReminder:no");

function selectDateKb() {
    return new InlineKeyboard()
        .text("Сегодня", `selectDate:0:days`)
        .text("Завтра", `selectDate:1:days`)
        .row()
        .text("Через 1 день", `selectDate:2:days`)
        .text("Через 2 дня", `selectDate:3:days`)
        .row()
        .text("Через 3 дня", `selectDate:3:days`)
        .text("Через 4 дня", `selectDate:4:days`)
        .row()
        .text("◀️ Главное меню", "start");
}

function selectUTCTimeKb() {
    return new InlineKeyboard()
        // .text("Через 5 сек. (temp)", "selectTimeAdd:5:seconds")
        // .text("Через 30 сек. (temp)", "selectTimeAdd:30:seconds")
        // .text("Через 1 минуту (temp)", "selectTimeAdd:1:minutes")
        // .row()
        .text("Через 5 минут", "selectTimeAdd:5:minutes")
        .text("Через 10 минут", "selectTimeAdd:10:minutes")
        .row()
        .text("Через 30 минут", "selectTimeAdd:30:minutes")
        .text("Через 1 час", "selectTimeAdd:60:minutes")
        .row()
        .text("Через 2 часа", "selectTimeAdd:60:minutes")
        .text("Через 3 часа", "selectTimeAdd:60:minutes")
        .row()
        .text("◀️ Главное меню", "start");
}

export {
    startKb,
    backToMainMenuKb,
    confirmAddReminderKb,
    selectDateKb,
    settingsKb,
    selectTimezoneKb,
    selectUTCTimeKb
};
