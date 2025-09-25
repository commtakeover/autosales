export function initial() {
    return {
        menu: {
            goods_menu: {
                state: '',
                filter: '',
                page: 0,
                totalPages: 0,
                restockId: 0,
                // activate: {
                //     page: 0,
                //     totalPages: 0,
                //     filter: '',
                //     restockId: 0,
                // },
                // move_to_stash: {
                //     page: 0,
                //     totalPages: 0,
                //     filter: '',
                //     restockId: 0,
                // },
                // sold: {
                //     page: 0,
                //     totalPages: 0,
                //     filter: '',
                //     restockId: 0,
                // },
                restoke_category: {
                    page: 0,
                    filter: '',
                    restockId: 0,
                },
            }
        },
        new_category: {
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
        },
        msgToDelete: {
            from: '',
            chat_id: 0,
            message_id: 0,
        }
    }
}