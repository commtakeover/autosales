import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import type { User } from './user.entity';

@Entity('incoming_wallet_transactions')
export class IncomingWalletTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne('User', 'wallet_transactions')
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar' })
  telegram_id: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;
 
  @Column({ type: 'decimal', precision: 18, scale: 8 })
  ltc_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  usd_amount: number;

  @Column({ unique: true })
  transaction_hash: string;

  @CreateDateColumn()
  created_at: Date;
}
