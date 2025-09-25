import type { User } from "../../db/entities/user.entity";

export async function usersMainMenu(users: User[], totalBalance: number) {
    // const allUsers = await UserRepository.findAllUsers()
    // const users = allUsers.map((user) => {
        // // filter user objects to get only users with role "user"
    //     return {
    //         id: user.id,
    //         telegram_id: user.telegram_id_hash,
    //         address_hash: user.address_hash,
    //         balance: user.balance_usd,
    //         discount: user.discount
    //     }
    // })
    // for (const user of users) {
    //    
    // }

    return `Всего пользователей: ${users.length}\nБаланс: ${totalBalance} USD`
}