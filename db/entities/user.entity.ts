import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import type { Role } from './role.entity';
import type { Purchase } from './purchase.entity';
import type { IncomingWalletTransaction } from './incoming-wallet-transaction.entity';
import type { UserReview } from './user-review.entity';
import type { PurchaseReview } from './purchase-review.entity';
import type { InventoryRestock } from './inventory-restock.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({ name: 'telegram_id_hash', type: "varchar" }) // MUST BE STORED AS HASH
  telegram_id_hash: string;
  
  @Column({name: 'balance_usd', type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance_usd: number;

  @Column({ name: 'reference_id', type: "varchar" })
  reference_id: string;
  
  @Column({ type: 'boolean', default: false })
  is_subscribed: boolean;

  @Column({ type: 'boolean', default: false })
  is_synced: boolean;

  @ManyToMany('Role', (role: Role) => role.users, { nullable: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles: Role[];
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @OneToMany('Purchase', (purchase: Purchase) => purchase.user, { nullable: true })
  purchases: Purchase[];

  @OneToMany('IncomingWalletTransaction', (transaction: IncomingWalletTransaction) => transaction.user, { nullable: true })
  wallet_transactions: IncomingWalletTransaction[];

  @Column({ type: 'varchar' })
  address_hash: string

  @Column({ type: 'int' })
  address_index: number
  
  @Column({ type: 'varchar', nullable: true })
  public_key: string

  // @Column({ type: 'varchar', nullable: true })
  // private_key: string

  // @Column({ type: 'varchar' }) // MUST BE STORED ENCRYPTED
  // encrypted_wif: string

  // @Column({ type: 'varchar' })
  // mnemonic: string

  // @Column({ type: 'varchar' })
  // seed: string

  @OneToMany('PurchaseReview', (purchase_review: PurchaseReview) => purchase_review.reviewer, { nullable: true })
  purchase_reviews: PurchaseReview[];
  
  @OneToMany('UserReview', (user_review: UserReview) => user_review.reviewer, { nullable: true })
  user_reviews: UserReview[];
  
  @OneToMany('UserReview', (user_review: UserReview) => user_review.target_user, { nullable: true })
  reviews_received: UserReview[];
  
  // @OneToMany(() => InventoryRestock, restoke => restoke.shopkeeper)
  // inventory_restokes: InventoryRestock[];
  
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
