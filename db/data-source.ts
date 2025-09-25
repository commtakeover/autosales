import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Link } from './entities/link.entity';
import { LinkCategory } from './entities/link-category.entity';
import { LinkPlace } from './entities/link-place.entity';
import { LinkSubplace } from './entities/link-subplace.entity';
import { Purchase } from './entities/purchase.entity';
import { IncomingWalletTransaction } from './entities/incoming-wallet-transaction.entity';
import { UserReview } from './entities/user-review.entity';
import { InventoryRestock } from './entities/inventory-restock.entity'; 
import { PurchaseReview } from './entities/purchase-review.entity';
import { LinkSubcategory } from './entities/link-subcategory.entity';
import { SubscribedAddresses } from './entities/subscribedAddresses.entity';
import { SyncedAddresses } from './entities/syncedAddresses.entity';
import { CryptoApisDerivedWalletData } from './entities/cryptoApisDerivedWalletData.entity';
import { IdempotencyKeys } from './entities/idempotencyKeys.entity';
import { LinkName } from './entities/link-name.entity';
import { LinkPrice } from './entities/link-price.entity';
import { LinkQuantity } from './entities/link-quantity.entity';
import { LinkMeasureUnits } from './entities/link-measure-units.entity';
import { Mailing } from './entities/mailing.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: String(process.env.DATABASE_PASSWORD),
  database: process.env.DATABASE_NAME,
  synchronize: true,
  logging: false,
  entities: [
    User,
    Role,
    Link,
    LinkCategory,
    LinkPlace,
    LinkSubplace,
    LinkSubcategory,
    Purchase,
    IncomingWalletTransaction,
    UserReview,
    PurchaseReview,
    InventoryRestock,
    SubscribedAddresses,
    SyncedAddresses,
    CryptoApisDerivedWalletData,
    IdempotencyKeys,
    LinkName,
    LinkPrice,
    LinkQuantity,
    LinkMeasureUnits,
    Mailing
  ],
  migrations: ['./migrations/*.ts'],
  extra: {
    max: 30,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000
  }
});