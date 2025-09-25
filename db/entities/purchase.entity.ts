import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import type { User } from './user.entity';
import type { Link } from './link.entity';
import type { PurchaseReview } from './purchase-review.entity';

// export enum PurchaseStatus {
//   DONE = "DONE",
//   ARGUED = "ARGUED",
//   SOLVED = "SOLVED",
//   RETURNED = "RETURNED"
// }

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne('User', (user: User) => user.purchases)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne('Link', (link: Link) => link.purchase)
  @JoinColumn({ name: 'link_id' })
  link: Link;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  purchase_price: number;

  @Column({ type:'decimal', precision: 12, scale: 2, default: 0.00 })
  discounted_amount: number;

  // @Column({ type: 'enum', enum: PurchaseStatus, default: PurchaseStatus.DONE })
  // purchase_status: PurchaseStatus;

  @OneToOne('PurchaseReview', (purchase_review: PurchaseReview) => purchase_review.purchase, { nullable: true })
  @JoinColumn({ name: 'purchase_review_id'})
  purchase_review: PurchaseReview;
  
  @CreateDateColumn()
  created_at: Date;

  @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
  edited_at: Date | null;
}
