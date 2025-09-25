import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { LinkSubplace } from './link-subplace.entity';

@Entity('link_place')
export class LinkPlace {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
  
  @OneToMany('LinkSubplace', (linkSubplace: LinkSubplace) => linkSubplace.place)
  // @Column({ nullable: true })
  subplaces: LinkSubplace[];
}
