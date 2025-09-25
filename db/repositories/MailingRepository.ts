import { AppDataSource } from '../data-source.js';
import { Mailing, MailingStatus } from '../entities/mailing.entity.js';

const mailingRepository = AppDataSource.getRepository(Mailing);

export class MailingRepository {
  /**
   * Create a new mailing record
   */
  static async createMailing(message: string, totalCount: number): Promise<Mailing> {
    const mailing = new Mailing();
    mailing.message = message;
    mailing.total_count = totalCount;
    mailing.status = MailingStatus.SENDING;
    
    return await mailingRepository.save(mailing);
  }

  /**
   * Update mailing status and counts
   */
  static async updateMailingStatus(
    id: number, 
    sentCount: number, 
    failedCount: number, 
    status: MailingStatus
  ): Promise<void> {
    await mailingRepository.update(id, {
      sent_count: sentCount,
      failed_count: failedCount,
      status: status
    });
  }

  /**
   * Get all mailings ordered by creation date (newest first)
   */
  static async getAllMailings(limit: number = 50): Promise<Mailing[]> {
    return await mailingRepository.find({
      order: {
        created_at: 'DESC'
      },
      take: limit
    });
  }

  /**
   * Get mailing by ID
   */
  static async getMailingById(id: number): Promise<Mailing | null> {
    return await mailingRepository.findOne({
      where: { id }
    });
  }
}
