import { AppDataSource } from '../data-source.js';
import { DashboardUser } from '../entities/dashboard_user.entity.ts';
import bcrypt from 'bcryptjs';

export const DashboardUserRepository = AppDataSource.getRepository(DashboardUser).extend({
    async verifyCredentials(login: string, password: string) {
        const user = await this.findOne({ where: { login } });
        if (!user || !user.isActive) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, login: user.login };
    },
    async createUser(login: string, password: string) {
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = this.create({ login, passwordHash, isActive: true });
        return this.save(newUser);
    },
    async updateUser(id: string, login: string, password: string) {
        const passwordHash = await bcrypt.hash(password, 10);
        const updatedUser = await this.update(id, { login, passwordHash, isActive: true });
        return updatedUser;
    },
    async deleteUser(id: string) {
        const deletedUser = await this.delete(id);
        return deletedUser;
    },
    async getUserById(id: string) {
        const user = await this.findOne({ where: { id } });
        return user;
    },
    async getUserByLogin(login: string) {
        const user = await this.findOne({ where: { login } });
        return user;
    },
    async getAllUsers() {
        const users = await this.find();
        return users;   
    },
});
