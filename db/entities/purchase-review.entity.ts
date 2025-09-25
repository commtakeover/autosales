import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, OneToOne } from 'typeorm';
import type { User } from './user.entity';
import type { Purchase } from './purchase.entity';

@Entity('purchase_reviews')
export class PurchaseReview {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne('User', 'purchase_reviews')
  @JoinColumn({ name: 'user_id' })
  reviewer: User;

  @OneToOne('Purchase', 'purchase_review')
  @JoinColumn({ name: 'purchase_id' })
  purchase: Purchase;

  @Column()
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
  edited_at: Date | null;
}
