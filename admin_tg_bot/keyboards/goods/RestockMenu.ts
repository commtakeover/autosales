import { Menu } from "@grammyjs/menu";
import { type MyContext } from "../../Context.ts";
import { editMessage } from "../keyboardUtils/KeyboardUtils.ts";
import { restockText } from "../../textGetters/restockText.ts";
import { CreateCategoryInlineKeyboard } from "./CreateCategory.ts";
import { createCategoryText } from "../../textGetters/createCategoryText.ts";
import { LinkCategoryRepository } from "../../../db/repositories/LinkCategoryRepository.ts";
import { goodsMenuWithStatusText } from "../../textGetters/goodsMenuWithStatusText.ts";
import { LinkStatus } from "../../../db/entities/link.entity.ts";
import { goodsMenuMainText } from "../../textGetters/goodsMenuMainText.ts";

export const GoodsMenuInlineKeyboard_restoke = new Menu<MyContext>("goods_menu_restoke")
    .submenu("🔠 Создать категорию", "create_category", async (ctx) => {
        ctx.session.new_category = {
            name: '',
            price_usd: '',
            place: '',
            subplace: '',
            manufacturer: '',
            deliverer: '',
            category: '',
            quantity: '',
            unit_of_measure: '',
            domain: '',
            subdomain: '',
            links: [],
        }
        await editMessage(ctx, await createCategoryText(ctx, ctx.session.new_category))
    })
    // .submenu("🛒 Пополнение", "create_category", async (ctx) => {
    //     ctx.session.new_category = {
    //         name: '',
    //         price_usd: '',
    //         place: '',
    //         subplace: '',
    //         manufacturer: '',
    //         deliverer: '',
    //         category: '',
    //         quantity: '',
    //         unit_of_measure: '',
    //         domain: '',
    //         subdomain: '',
    //     }
    //     await editMessage(ctx, await createCategoryText(ctx, ctx.session.new_category))
    // })
    .row()
    // .text("__ Категории: __").row()
    
    // // Display all categories in a paginated list
    // // Each page shows up to 8 category buttons
    // // Navigation buttons appear when there are multiple pages
    .dynamic(async (ctx, range) => {
        // const categories = await LinkCategoryRepository.findAllCategories();
        // for (const category of categories) {
        //     range.text(category.name, async (ctx) => {
        //         // TODO: Implement category selection logic
        //     }).row();
        // }
        // return range;

        return void 0;
    })
    .row()
    .back("◀️ Назад", async (ctx) => {
        await editMessage(ctx, await goodsMenuMainText())
    })

GoodsMenuInlineKeyboard_restoke.register(CreateCategoryInlineKeyboard)