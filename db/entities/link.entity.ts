import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import type { User } from './user.entity';
import type { LinkCategory } from './link-category.entity';
import type { Purchase } from './purchase.entity';
import type { InventoryRestock } from './inventory-restock.entity';
import type { LinkSubplace } from './link-subplace.entity';
import type { LinkPlace } from './link-place.entity';
import type { LinkName } from './link-name.entity';
import type { LinkPrice } from './link-price.entity';
import type { LinkQuantity } from './link-quantity.entity';
import type { LinkMeasureUnits } from './link-measure-units.entity';

export enum LinkStatus {
  ACTIVE = "ACTIVE",
  STASHED = "STASHED",
  SOLD = "SOLD"
}

@Entity('links')
export class Link {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: LinkStatus, default: LinkStatus.STASHED })
  link_status: LinkStatus;

  @ManyToOne('InventoryRestock', (inventory_restock: InventoryRestock) => inventory_restock.links, { nullable: true })
  @JoinColumn({ name: 'inventory_restock_id' })
  inventory_restock: InventoryRestock

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price_usd: number;

  @OneToOne('Purchase', (purchase: Purchase) => purchase.link, { nullable: true })
  @JoinColumn({ name: 'purchase_id' })
  purchase: Purchase;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ nullable: true })
  deliverer: string;

  @ManyToOne('LinkCategory', (category: LinkCategory) => category.links, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: LinkCategory;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  unit_of_measure: string;

  @ManyToOne('LinkPlace', { nullable: true })
  @JoinColumn({ name: 'place_id' })
  place: LinkPlace;

  @ManyToOne('LinkSubplace', { nullable: true })
  @JoinColumn({ name: 'subplace_id' })
  subplace: LinkSubplace;

  @ManyToOne('LinkName', (linkName: LinkName) => linkName.links, { nullable: true })
  @JoinColumn({ name: 'link_name_id' })
  linkName: LinkName;

  @ManyToOne('LinkPrice', (linkPrice: LinkPrice) => linkPrice.links, { nullable: true })
  @JoinColumn({ name: 'link_price_id' })
  linkPrice: LinkPrice;

  @ManyToOne('LinkQuantity', (linkQuantity: LinkQuantity) => linkQuantity.links, { nullable: true })
  @JoinColumn({ name: 'link_quantity_id' })
  linkQuantity: LinkQuantity;

  @ManyToOne('LinkMeasureUnits', (linkMeasureUnits: LinkMeasureUnits) => linkMeasureUnits.links, { nullable: true })
  @JoinColumn({ name: 'link_measure_units_id' })
  linkMeasureUnits: LinkMeasureUnits;

  @Column()
  link: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
