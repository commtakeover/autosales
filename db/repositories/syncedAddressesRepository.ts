import { SyncedAddresses } from '../entities/syncedAddresses.entity';
import { DataSource, DeleteResult, Repository, UpdateResult } from 'typeorm';

export class SyncedAddressesRepository extends Repository<SyncedAddresses> {
  constructor(private readonly dataSource: DataSource) {
    super(SyncedAddresses, dataSource.createEntityManager());
  }

  async createSyncedAddress(address: string): Promise<SyncedAddresses> {
    const syncedAddress = this.create({ address, isSynced: true, edited_at: new Date() });
    return this.save(syncedAddress);
  }

  async deleteSyncedAddress(address: string): Promise<DeleteResult> {
    return this.delete({ address });
  }

  async getSyncedAddressByAddress(address: string): Promise<SyncedAddresses | null> {
    return this.findOne({ where: { address } });
  }

  async updateSyncedAddress(address: string, isSynced: boolean): Promise<UpdateResult> {
    return this.update({ address }, { isSynced, edited_at: new Date() });
  }

  async getSyncedAddresses(): Promise<SyncedAddresses[]> {
    return this.find();
  }
}   