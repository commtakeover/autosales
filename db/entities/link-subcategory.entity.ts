import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { LinkCategory } from './link-category.entity';

@Entity('link_subcategory')
export class LinkSubcategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
  
  @ManyToOne('LinkCategory', 'subcategories', {nullable: true})
  @JoinColumn({ name: 'category_id' })
  category: LinkCategory;
}