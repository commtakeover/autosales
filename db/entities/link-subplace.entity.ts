import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { LinkPlace } from './link-place.entity';

@Entity('link_subplace')
export class LinkSubplace {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
  
  @ManyToOne('LinkPlace', (linkPlace: LinkPlace) => linkPlace.subplaces, { nullable: true })
  @JoinColumn({ name: 'place_id' })
  place: LinkPlace;
}
