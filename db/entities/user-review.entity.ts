import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import type { User } from './user.entity';

@Entity('user_reviews')
export class UserReview {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne('User', (user: User) => user.user_reviews)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @ManyToOne('User', (user: User) => user.reviews_received)
  @JoinColumn({ name: 'user_id' })
  target_user: User;

  @Column()
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
  edited_at: Date | null;
}
