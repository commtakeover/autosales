import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum MailingStatus {
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed'
}

@Entity('mailings')
export class Mailing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'int', default: 0 })
  sent_count: number;

  @Column({ type: 'int', default: 0 })
  failed_count: number;

  @Column({ type: 'int', default: 0 })
  total_count: number;

  @Column({
    type: 'enum',
    enum: MailingStatus,
    default: MailingStatus.SENDING
  })
  status: MailingStatus;

  @CreateDateColumn()
  created_at: Date;
}
