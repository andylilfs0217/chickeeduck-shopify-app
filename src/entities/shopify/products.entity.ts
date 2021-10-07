import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface ShopifyProductVariantDto {
  id: number;
  shopifyProductVariantTitle?: string;
  shopifyProductId: number;
  shopifyProductTitle?: string;
  shopifyVariantInventoryItemId: number;
  productSKU?: string;
  productBarcode?: string;
}

@Entity()
export class TShopifyProductVariants {
  /** Shopify product variant ID */
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  /** Shopify product variant title */
  @Column({ nullable: true })
  shopifyProductVariantTitle: string;

  /** Shopify product ID */
  @Column({ type: 'bigint' })
  shopifyProductId: number;

  /** Shopify product title */
  @Column({ nullable: true })
  shopifyProductTitle: string;

  /** Shopify inventory item ID */
  @Column({ type: 'bigint' })
  shopifyVariantInventoryItemId: number;

  /** Shopify product variant SKU */
  @Column({ nullable: true })
  productSKU: string;

  /** Shopify product variant barcode */
  @Column({ nullable: true })
  productBarcode: string;

  /** Entity created date */
  @CreateDateColumn()
  createdDate: Date;

  /** Entity updated date */
  @UpdateDateColumn()
  updatedDate: Date;

  /** Entity deleted date */
  @DeleteDateColumn()
  deletedDate: Date;
}
