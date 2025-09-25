import { AppDataSource } from "../data-source";
import { Role, UserRoleType } from "../entities/role.entity";

export const RoleRepository = AppDataSource.getRepository(Role).extend({
    async findById(id: number): Promise<Role | null> {
        return await this.findOneBy({ id });
    },

    async findByName(name: UserRoleType): Promise<Role | null> {
        return await this.findOneBy({ name });
    },

    async findAllRoles(): Promise<Role[]> {
        return await this.find();
    },

    async createRole(name: UserRoleType): Promise<Role> {
        const role = this.create({ name });
        return await this.save(role);
    },

    async updateRole(id: number, name: UserRoleType): Promise<Role> {
        const role = await this.findOneBy({ id });
        if (!role) {
            throw new Error("Role not found");
        }
        
        role.name = name;
        return await this.save(role);
    },

    async deleteRole(id: number): Promise<void> {
        const result = await this.delete(id);
        if (result.affected === 0) {
            throw new Error("Role not found");
        }
    }
}); 