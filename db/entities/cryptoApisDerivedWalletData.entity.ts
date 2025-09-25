import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class CryptoApisDerivedWalletData {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    lastUsedId: number;
}