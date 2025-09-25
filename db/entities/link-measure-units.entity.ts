import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { Link } from './link.entity';

@Entity('link_measure_units')
export class LinkMeasureUnits {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  unit_of_measure: string;
  
  @OneToMany('Link', (link: Link) => link.linkMeasureUnits, { nullable: true })
  links: Link[];
}
