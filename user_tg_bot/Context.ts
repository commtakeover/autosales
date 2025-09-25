import { type ConversationFlavor } from "@grammyjs/conversations";
import { type Conversation } from "@grammyjs/conversations";
import { type HydrateFlavor } from "@grammyjs/hydrate";
import { type Context, type SessionFlavor } from "grammy";

export interface SessionData {
    msgToDelete: {
        from: string;
        chat_id: number;
        message_id: number;
    };
    user: {
        user_id: string;
        wallet_address: string;
    };
    buy_menu: {
        category: string;
        place: string;
        subplace: string;
        link: {
            id: number;
            displayText: string;
            link: string;
        };
    };
    purchases: {
        currentPage: number;
        totalPages: number;
    };
    reviews: {
        mode: "all" | "my";
        currentPage: number;
        totalPages: number;
        purchaseIdToReview: number;
        review: {
            rating: number;
            comment: string;
        };
    };
}

export type MyContext = ConversationFlavor<Context & SessionFlavor<SessionData>>;

export type GoodsMenuContext = HydrateFlavor<MyContext>;
export type GoodsMenuConversation = Conversation<MyContext, GoodsMenuContext>;

export type BuyLinkContext = HydrateFlavor<MyContext>;
export type BuyLinkConversation = Conversation<MyContext, BuyLinkContext>;

export type LeaveReviewContext = HydrateFlavor<MyContext>;
export type LeaveReviewConversation = Conversation<MyContext, LeaveReviewContext>;