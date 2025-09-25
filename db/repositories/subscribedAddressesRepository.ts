import { SubscribedAddresses } from '../entities/subscribedAddresses.entity';
import { DataSource, DeleteResult, Repository, UpdateResult } from 'typeorm';

export class SubscribedAddressRepository extends Repository<SubscribedAddresses> {
  constructor(private readonly dataSource: DataSource) {
    super(SubscribedAddresses, dataSource.createEntityManager());
  }

  async createSubscribedAddress(address: string): Promise<SubscribedAddresses> {
    const subscribedAddress = this.create({ address, isSubscribed: true, edited_at: new Date() });
    return this.save(subscribedAddress);
  }

  async deleteSubscribedAddress(address: string): Promise<DeleteResult> {
    return this.delete({ address });
  }

  async getSubscribedAddressByAddress(address: string): Promise<SubscribedAddresses | null> {
    return this.findOne({ where: { address } });
  }

  async updateSubscribedAddress(address: string, isSubscribed: boolean): Promise<UpdateResult> {
    return this.update({ address }, { isSubscribed, edited_at: new Date() });
  }

  async getSubscribedAddresses(): Promise<SubscribedAddresses[]> {
    return this.find();
  }

  
}