import { Context, InlineKeyboard } from "grammy";
import { findAllLinksWithStatus_mock, generateMockData } from "../../mockup_db";

export const editMessage = async (ctx: Context, message: string, entities?: any[]) => {
    try {
        if (entities) {
            await ctx.editMessageText(message, { entities: entities });
        } else {
            await ctx.editMessageText(message);
        }
    } catch (error: any) {
        console.log("[editMessage error] - ", error.message);
    }
};

export async function getGoodsAndStringify(status: string, amount: number, groupBy?: 'restoke' | 'place' | 'category' | 'manufacturer' | 'delivery', preString?: string) {
    // const goods = await getGoodsWithStatus(status, amount);
    const goods = await generateMockData(status, amount);
    const goodsString = await stringifyGoodsByCategory(goods, groupBy);
    return preString ? `${preString}\n\t${goodsString}` : goodsString;
}

export async function getGoodsWithStatus(status: string, amount: number) {
    const goods = await findAllLinksWithStatus_mock(status, amount);
    return goods;
}

export async function stringifyGoodsByCategory(goods: any[], groupBy?: 'restoke' | 'place' | 'category' | 'manufacturer' | 'delivery') {
    if (!groupBy) {
        return goods.map(good => `\t${good.id} | ${good.name} | ${good.price_usd} | ${good.link_status}`).join('\n');
    }

    // Group goods by the specified property
    const grouped = goods.reduce((acc, good) => {
        let key = '';
        switch(groupBy) {
            case 'restoke':
                key = good.inventory_restoke?.id?.toString() || 'No Restoke';
                break;
            case 'place':
                key = `${good.place || 'No Place'} - ${good.subplace || 'No subplace'}`;
                break;
            case 'category':
                key = good.category?.name || 'No Category';
                break;
            case 'manufacturer':
                key = good.manufacturer || 'No Manufacturer';
                break;
            case 'delivery':
                key = good.deliverer || 'No Deliverer';
                break;
        }

        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(good);
        return acc;
    }, {});

    // Convert grouped objects to string
    return Object.entries(grouped)
        .map(([key, goods]) => {
            const goodsStr = (goods as any[])
                .map(good => `\t${good.id} | ${good.name} | ${good.price_usd} | ${good.link_status}`)
                .join('\n');
            return `${key}:\n${goodsStr}`;
        })
        .join('\n\n');
}
