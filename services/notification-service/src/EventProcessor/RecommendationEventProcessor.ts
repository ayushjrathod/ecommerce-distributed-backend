import axios from 'axios';
import cron from 'node-cron';
import {
  EmailContent,
  Notification,
  NotificationPriority,
  NotificationType,
} from '../models/notification';
import { sendEmail } from '../services/emailService';
import { NotificationDoc, User } from '../types/types';
import { DeadLetterQueueHandler } from './DeadLetterQueue';

interface RecommendationItem {
  _id: string;
  name: string;
  price: number;
  category: string;
}

interface RecommendationEvent {
  type: string;
  userId: string;
  recommendations: RecommendationItem[];
}

export class RecommendationEventProcessor {
  private readonly deadLetterQueueHandler: DeadLetterQueueHandler;
  private readonly usersServiceUrl: string;
  private cronJob: cron.ScheduledTask | null = null;
  private readonly concurrencyLimit = 5;
  private readonly maxRetries = 3;
  private readonly emailTemplate = {
    subject: 'Curated Product Recommendations Just for You!',
    type: NotificationType.RECOMMENDATION,
  };

  constructor() {
    this.deadLetterQueueHandler = new DeadLetterQueueHandler();
    this.usersServiceUrl = process.env.USERS_SERVICE_URL || '';
    this.initializeCronJob();
  }

  private initializeCronJob(): void {
    this.cronJob = cron.schedule('*/5 * * * *', this.processPendingNotifications.bind(this), {
      scheduled: true,
      timezone: 'UTC',
    });
  }

  private async processPendingNotifications(): Promise<void> {
    const pendingNotifications = await Notification.find({
      type: NotificationType.RECOMMENDATION,
      emailSent: false,
      sentAt: { $exists: false },
    }).limit(10);

    if (pendingNotifications.length === 0) return;

    const batches = this.createBatches(pendingNotifications, this.concurrencyLimit);
    for (const batch of batches) {
      await Promise.all(
        batch.map((notification) =>
          this.sendEmailNotification(notification as unknown as NotificationDoc)
        )
      );
    }
  }

  private createBatches<T>(items: T[], size: number): T[][] {
    return items.reduce((batches: T[][], item: T, index: number) => {
      const batchIndex = Math.floor(index / size);
      if (!batches[batchIndex]) batches[batchIndex] = [];
      batches[batchIndex].push(item);
      return batches;
    }, []);
  }

  private async sendEmailNotification(notification: NotificationDoc): Promise<void> {
    if (notification.emailSent) return;

    try {
      const user = await this.getUserData(notification.userId);
      if (!user || !this.validateEmailFormat(user.email)) {
        throw new Error(`Invalid or missing email for user ${notification.userId}`);
      }

      if (!user.preferences?.recommendations) {
        console.log(`User ${user.email} has opted out of recommendations.`);
        await this.markNotificationProcessed(notification, false);
        return;
      }

      const recommendations = notification.content.recommendations as RecommendationItem[];
      // Pass recommendations object directly as content
      await sendEmail(user._id, this.emailTemplate.subject, this.emailTemplate.type, {
        recommendations,
        itemCount: recommendations.length,
      });

      await this.markNotificationProcessed(notification, true);
      console.log(`Email sent successfully to ${user.email}`);
    } catch (error) {
      console.error(`Email sending failed for user ${notification.userId}:`, error);
    }
  }

  async processRecommendationEvent(
    event: RecommendationEvent,
    context: { topic: string; partition: number; offset: string }
  ): Promise<boolean> {
    let retryCount = 0;

    while (retryCount < this.maxRetries) {
      try {
        if (!this.validateEvent(event)) return false;

        const user = await this.getUserData(event.userId);
        if (!user) throw new Error(`User data not found for userId: ${event.userId}`);

        if (!user.preferences?.recommendations) {
          console.log(`User ${user.email} has opted out of recommendations.`);
          return true;
        }

        const notification = await this.createNotification(user, event);
        if (notification) {
          await this.sendEmailNotification(notification);
        }

        return true;
      } catch (error) {
        retryCount++;
        if (retryCount === this.maxRetries) {
          await this.deadLetterQueueHandler.handleFailedMessage(
            context.topic,
            { ...event } as Record<string, unknown>,
            error as Error,
            { partition: context.partition, offset: context.offset }
          );
          return false;
        }
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
    return false;
  }

  private validateEvent(event: RecommendationEvent): boolean {
    return Boolean(
      event?.userId &&
        event.type &&
        event &&
        Array.isArray(event.recommendations) &&
        event.recommendations.length > 0 &&
        event.recommendations.every(this.validateRecommendationItem)
    );
  }

  private validateRecommendationItem(rec: RecommendationItem): boolean {
    return Boolean(rec._id && rec.name && typeof rec.price === 'number' && rec.category);
  }

  private validateEmailFormat(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async createNotification(
    user: User,
    event: RecommendationEvent
  ): Promise<NotificationDoc | null> {
    const now = new Date().toISOString();
    return Notification.create({
      userId: user._id,
      email: user.email,
      type: NotificationType.RECOMMENDATION,
      content: {
        recommendations: event.recommendations,
        timestamp: now,
      },
      priority: NotificationPriority.STANDARD,
      metadata: {
        recommendationSource: event.type,
        generatedAt: now,
        userPreferences: user.preferences,
      },
      emailSent: false,
      read: false,
      createdAt: new Date(),
    }) as unknown as NotificationDoc;
  }

  private async getUserData(userId: string): Promise<User | null> {
    try {
      const response = await axios.get(`${this.usersServiceUrl}/${userId}`, {
        timeout: 5000,
        validateStatus: (status: number) => status === 200,
      });

      const userData = response.data?.result || response.data;
      if (!userData?.email) {
        console.error(`No email in response for user ${userId}:`, response.data);
        return null;
      }

      return {
        _id: userData._id || userId,
        email: userData.email,
        name: userData.name || 'Valued Customer',
        preferences: userData.preferences || {},
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(`Failed to fetch user data for ${userId}:`, {
          status: error.response?.status,
          message: error.message,
        });
      } else if (error instanceof Error) {
        console.error(`Error fetching user data for ${userId}:`, error.message);
      } else {
        console.error(`Error fetching user data for ${userId}:`, error);
      }
      return null;
    }
  }

  private formatRecommendationEmail(recommendations: RecommendationItem[]): EmailContent {
    return {
      recommendations,
      itemCount: recommendations.length,
    };
  }

  private async markNotificationProcessed(
    notification: NotificationDoc,
    sent: boolean
  ): Promise<void> {
    notification.emailSent = sent;
    notification.sentAt = new Date();
    await notification.save();
  }

  public stopCronJob(): void {
    if (this.cronJob) {
      this.cronJob.stop();
    }
  }
}
