import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { Link } from './link.entity';

@Entity('link_prices')
export class LinkPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, unique: true })
  price_usd: number;
  
  @OneToMany('Link', (link: Link) => link.linkPrice, { nullable: true })
  links: Link[];
}
