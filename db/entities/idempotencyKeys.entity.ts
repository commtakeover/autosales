import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('idempotency_keys')
export class IdempotencyKeys {
    @Column({ primary: true, unique: true })
    idempotencyKey: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}