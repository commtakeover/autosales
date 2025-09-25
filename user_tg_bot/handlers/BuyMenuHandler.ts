import { type MyContext } from "../Context.js";
import { getBuyMenuText } from "../textGetters/BuyMenuText.js";
import { BuyMenuInlineKeyboard } from "../keyboards/BuyMenuKeyboard.js";
import { LinkStatus } from "../../db/entities/link.entity.js";
import { Link } from "../../db/entities/link.entity.js";
import { LinkCategory } from "../../db/entities/link-category.entity.js";
import { LinkPlace } from "../../db/entities/link-place.entity.js";
import { LinkSubplace } from "../../db/entities/link-subplace.entity.js";
import { InventoryRestock } from "../../db/entities/inventory-restock.entity.js";
import { Purchase } from "../../db/entities/purchase.entity.js";
import { LinkRepository } from "../../db/repositories/LinkRepository.js";

export async function BuyMenuHandler(ctx: MyContext) {
    ctx.session.buy_menu.category = ''
    ctx.session.buy_menu.place = ''
    ctx.session.buy_menu.subplace = ''
    ctx.session.buy_menu.link = {
        id: 0,
        displayText: '',
        link: '',
    }
    const activeLinks = await LinkRepository.findAllLinksWithStatus(LinkStatus.ACTIVE)
    if (activeLinks.length > 0) {
        await ctx.reply("Выберите категорию:", { reply_markup: BuyMenuInlineKeyboard });
    } else {
        await ctx.reply("🙁 Товары закончились 🤷")
    }
}   