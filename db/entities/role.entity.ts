import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import type { User } from './user.entity';

export enum UserRoleType {
  USER = 'User',
  SHOPKEEPER = 'Shopkeeper',
  MANUFACTURER = 'Manufacturer',
  DELIVERER = 'Deliverer',
  SUPER_ADMIN = 'SuperAdmin',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: UserRoleType, unique: true, nullable: false })
  name: UserRoleType;

  @ManyToMany('User', (user: User) => user.roles)
  users: User[];
}
