import { type HydrateFlavor } from "@grammyjs/hydrate";
import { type Context, type SessionFlavor } from "grammy";
import { type Conversation } from "@grammyjs/conversations";
import { type ConversationFlavor } from "@grammyjs/conversations";

export interface SessionData {
    menu: {
        goods_menu: {
            state: string;
            filter: string;
            page: number;
            totalPages: number;
            restockId: number;
            // activate: {
            //     page: number;
            //     totalPages: number;
            //     filter: string;
            //     restockId: number;
            // };
            // move_to_stash: {
            //     page: number;
            //     totalPages: number;
            //     filter: string;
            //     restockId: number;
            // };
            // sold: {
            //     page: number;
            //     totalPages: number;
            //     filter: string;
            //     restockId: number;
            // };
            restoke_category: {
                page: number;
                filter: string;
                restockId: number;
            };
        }
    },
    new_category: {
        name: string;
        price_usd: string;
        place: string;
        subplace: string;
        manufacturer: string;
        deliverer: string;
        category: string;
        quantity: string;
        unit_of_measure: string;
        domain: string;
        subdomain: string;
        links: string[];
    },
    msgToDelete: {
        from: string;
        chat_id: number;
        message_id: number;
    }
}

export type MyContext = ConversationFlavor<Context & SessionFlavor<SessionData>>;

export type GoodsMenuContext = HydrateFlavor<MyContext>;
export type GoodsMenuConversation = Conversation<MyContext, GoodsMenuContext>;

export type NameContext = HydrateFlavor<Context>;
// export type NameConversation = Conversation<MyContext, NameContext>;

export type EmailContext = HydrateFlavor<Context>;
// export type EmailConversation = Conversation<MyContext, EmailContext>;

export type PriceContext = HydrateFlavor<MyContext>;
export type PriceConversation = Conversation<MyContext, PriceContext>;

export type UnitOfMeasureContext = HydrateFlavor<MyContext>;
export type UnitOfMeasureConversation = Conversation<MyContext, UnitOfMeasureContext>;

export type ActivateLinkContext = HydrateFlavor<MyContext>;
export type ActivateLinkConversation = Conversation<MyContext, ActivateLinkContext>;

export type MoveLinkToStashContext = HydrateFlavor<MyContext>;
export type MoveLinkToStashConversation = Conversation<MyContext, MoveLinkToStashContext>;

export type HideLinkContext = HydrateFlavor<MyContext>;
export type HideLinkConversation = Conversation<MyContext, HideLinkContext>;

export type ChangeBalanceContext = HydrateFlavor<MyContext>;
export type ChangeBalanceConversation = Conversation<MyContext, ChangeBalanceContext>;