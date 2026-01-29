import axios from 'axios';
import { Notification, NotificationPriority, NotificationType } from '../models/notification';
import { sendEmail } from '../services/emailService';
import { NotificationPayload, User } from '../types/types';
import { DeadLetterQueueHandler } from './DeadLetterQueue';


interface ProductDocument { 
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface PromoEventMetadata { 
  source: string;
  batchId: string;
}

interface PromotionalEvent { 
  timestamp: Date;
  products: ProductDocument[];
  eventType: 'promotional-batch';
  metadata: PromoEventMetadata;
}


export interface ProductEventContext {
  topic: string;
  partition: number;
  offset: string;
}

export interface ProductEvent {
  userId: string;
  email: string;
  eventType: string;
  details?: {
    message?: string;
    name?: string;
  };
  metadata?: {
    batchId?: string;
  };
}

export class ProductEventProcessor {
  private static readonly MAX_RETRIES = 5;
  private static readonly BASE_DELAY = 500;
  private static readonly RANDOM_USERS_COUNT = 10;
  private static readonly REQUEST_TIMEOUT = 5000;
  private deadLetterQueueHandler: DeadLetterQueueHandler;

  constructor() {
    this.deadLetterQueueHandler = new DeadLetterQueueHandler();
    console.log('[ProductEventProcessor] Initialized. Now expects promotional events from Kafka.');
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async getRandomUsers(count: number): Promise<User[]> {
    if (!process.env.USERS_SERVICE_URL) {
      throw new Error('[ProductEventProcessor] Users Service URL is not configured');
    }

    try {
      const response = await axios.get(process.env.USERS_SERVICE_URL, {
        timeout: ProductEventProcessor.REQUEST_TIMEOUT,
      });

      return (response.data?.result || [])
        .filter(
          (user: User) =>
            ProductEventProcessor.isValidEmail(user.email) && user.preferences?.promotions !== false
        )
        .sort(() => 0.5 - Math.random())
        .slice(0, count);
    } catch (error) {
      console.error('[ProductEventProcessor] Failed to fetch users:', error);
      throw new Error(`Failed to retrieve users: ${(error as Error).message}`);
    }
  }

  private async sendPromotionalEmail(
    userId: string,
    content: { name: string; message: string }
  ): Promise<void> {
    await sendEmail(
      userId,
      `Special Promotion Just for You, ${content.name}!`,
      NotificationType.PROMOTION,
      {
        subject: `Promotion: Dont miss out on this, ${content.name}!`,
        message: content.message,
        name: content.name,
      }
    );
  }

  private async createNotificationForEvent(params: NotificationPayload): Promise<Notification> {
    try {
      const notification = await Notification.create({
        userId: params.userId,
        email: params.email,
        type: params.type,
        content: params.content,
        priority: params.priority,
        metadata: params.metadata || {},
        sentAt: new Date(),
        read: false,
      });

      if (params.type === NotificationType.PROMOTION) {
        try {
          await this.sendPromotionalEmail(params.userId, params.content);
        } catch (emailError) {
          console.error('[ProductEventProcessor] Email Sending Failed:', {
            email: params.email,
            error: (emailError as Error).message,
          });
        }
      }

      return notification as unknown as Notification;
    } catch (error) {
      console.error('[ProductEventProcessor] Notification Processing Error:', {
        message: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Method to process PromotionalEvent from Kafka and send notifications.
   * This now exclusively handles the promotional event sending to users.
   */
  public async processPromotionalEventFromKafka(
    event: PromotionalEvent, // Uses the locally defined interface
    context: ProductEventContext
  ): Promise<boolean> {
    try {
      console.log(`[ProductEventProcessor] Processing promotional event from Kafka: Batch ID ${event.metadata.batchId}`);

      const randomUsers = await this.getRandomUsers(ProductEventProcessor.RANDOM_USERS_COUNT);
      if (!randomUsers.length) {
        console.log('[ProductEventProcessor] No users found to send promotional event from Kafka.');
        return true; // Consider it handled if no users to send to
      }

      // Create a generic promotional message based on the Kafka event
      const promotionalContent = {
        message: `Exciting offers on our latest products! Check out: ${event.products.map(p => p.name).join(', ').substring(0, 100)}...`,
        eventType: event.eventType,
      };

      console.log(`[ProductEventProcessor] Sending notifications for Kafka promo event to ${randomUsers.length} users.`);

      const notifications = randomUsers.map((user) =>
        this.createNotificationForEvent({
          userId: user._id,
          email: user.email,
          type: NotificationType.PROMOTION,
          content: { ...promotionalContent, name: user.name },
          priority: NotificationPriority.STANDARD,
          metadata: {
            batchId: event.metadata.batchId,
            isAutomated: true,
            userPreferences: user.preferences,


          },
        })
      );

      await Promise.all(notifications);
      console.log(`[ProductEventProcessor] Successfully processed promotional event from Kafka: Batch ID ${event.metadata.batchId}`);
      return true;
    } catch (error) {
      console.error(`[ProductEventProcessor] Error processing promotional event from Kafka:`, error);
      await this.deadLetterQueueHandler.handleFailedMessage(
        context.topic,
        event as unknown as Record<string, unknown>,
        error as Error,
        {
          partition: context.partition,
          offset: context.offset,
        }
      );
      return false;
    }
  }

  async processProductEventWithRetry(
    event: ProductEvent,
    context: ProductEventContext,
    retryCount = 0
  ): Promise<boolean> {
    try {
      await this.createNotificationForEvent({
        userId: event.userId,
        email: event.email,
        type: NotificationType.PROMOTION,
        content: {
          message: event.details?.message || 'Product event processed',
          eventType: event.eventType,
          name: event.details?.name || 'Valued Customer',
        },
        priority: NotificationPriority.STANDARD,
        metadata: {
          batchId: event.metadata?.batchId || `RETRY_${Date.now()}`,
          isAutomated: true,
          retryCount,
        },
      });
      return true;
    } catch (error) {
      if (retryCount < ProductEventProcessor.MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * ProductEventProcessor.BASE_DELAY;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.processProductEventWithRetry(event, context, retryCount + 1);
      }

      const eventAsRecord: Record<string, unknown> = {
        userId: event.userId,
        email: event.email,
        eventType: event.eventType,
        details: event.details,
        metadata: event.metadata,
      };

      await this.deadLetterQueueHandler.handleFailedMessage(
        context.topic,
        eventAsRecord,
        error as Error,
        {
          partition: context.partition,
          offset: context.offset,
        }
      );
      return false;
    }
  }
}
