import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { LinkSubcategory } from './link-subcategory.entity';
import type { Link } from './link.entity';

@Entity('link_category')
export class LinkCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
  
  @OneToMany('LinkSubcategory', (subcategory: LinkSubcategory) => subcategory.category, { nullable: true })
  // @Column({ nullable: true })
  subcategories: LinkSubcategory[];

  @OneToMany('Link', (link: Link) => link.category, { nullable: true })
  links: Link[];
}
