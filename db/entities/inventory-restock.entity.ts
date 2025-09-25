import type { Link } from './link.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany, UpdateDateColumn, JoinColumn } from 'typeorm';


@Entity('inventory_restocks')
export class InventoryRestock {
  @PrimaryGeneratedColumn()
  id: number;

  // @ManyToOne(() => User, user => user.inventory_restokes, { nullable: true })
  // @JoinColumn({ name: 'shopkeeper_id' })
  // shopkeeper: User;

  @OneToMany('Link', (link: Link) => link.inventory_restock, { nullable: true })
  links: Link[];

  @Column({ nullable: true })
  quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
