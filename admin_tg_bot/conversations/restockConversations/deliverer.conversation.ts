import { bot } from "../../bot.ts";
import { type MyContext } from "../../Context.ts";
import { editMessage } from "../../keyboards/keyboardUtils/KeyboardUtils.ts";
import { createCategoryText } from "../../textGetters/createCategoryText.ts";
import { createCategoryClone } from "../menuClones.ts/createCategoryClone.ts";

export async function delivererConversation(conversation: any, ctx: MyContext) {
    const categoryClone = createCategoryClone(conversation);

    const msg = await ctx.reply("Отправьте имя доставщика");
    const deliverer = await conversation.form.text({
        action: async (ctx: any) => {
            await bot.api.deleteMessage(msg.chat.id, msg.message_id);
            await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
        }
    });
    
    let newCategory: any;

    await conversation.external((ctx: MyContext) => {
        ctx.session.new_category.deliverer = deliverer;
        newCategory = ctx.session.new_category;
    });

    await editMessage(ctx, await createCategoryText(ctx, newCategory));
    await ctx.editMessageReplyMarkup({ reply_markup: categoryClone });
} 