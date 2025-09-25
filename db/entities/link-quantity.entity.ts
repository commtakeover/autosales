import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { Link } from './link.entity';

@Entity('link_quantities')
export class LinkQuantity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  quantity: number;
  
  @OneToMany('Link', (link: Link) => link.linkQuantity, { nullable: true })
  links: Link[];
}
