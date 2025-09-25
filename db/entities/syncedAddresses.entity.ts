import { Entity, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class SyncedAddresses {
  @Column({ primary: true, unique: true })
  address: string;

  @Column({ default: false, type: 'boolean' })
  isSynced: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
  edited_at: Date | null;
}