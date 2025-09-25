export async function initial() {
    return {
        msgToDelete: {
            from: '',
            chat_id: 0,
            message_id: 0,
        },
        user: {
            user_id: '1',
            wallet_address: 'ltc1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        buy_menu: {
            category: '',
            place: '',
            subplace: '',
            link: {
                id: 0,
                displayText: '',
                link: '',
            },
        },
        purchases: {
            currentPage: 1,
            totalPages: 1,
        },
        reviews: {
            mode: "all",
            currentPage: 1,
            totalPages: 0,
            purchaseIdToReview: 0,
            review: {
                rating: 0,
                comment: '',
            },
        }
    }
}