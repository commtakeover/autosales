import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { Link } from './link.entity';

@Entity('link_names')
export class LinkName {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
  
  @OneToMany('Link', (link: Link) => link.linkName, { nullable: true })
  links: Link[];
}
