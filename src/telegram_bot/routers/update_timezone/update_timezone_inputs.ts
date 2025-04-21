import {replyOrEditMessage} from "../../custom_methods";
import {selectTimezoneKb} from "../../keyboard";
import {MyContext, states} from "../../types";

async function input_timezone(ctx: MyContext) {
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

export {input_timezone};
