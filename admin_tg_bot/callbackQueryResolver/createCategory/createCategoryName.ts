import { type MyContext } from "../../Context.ts";

export const createCategoryName = async (ctx: MyContext) => {
    await ctx.conversation.enter("create_category_name");
}