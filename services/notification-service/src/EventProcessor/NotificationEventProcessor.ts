import { Consumer, KafkaMessage } from 'kafkajs';
import { consumer, kafka, producer } from '../kafka/kafka';
import { DeadLetterQueueHandler } from './DeadLetterQueue';
import { OrderUpdateEventProcessor } from './OrderEventProcessor';
import { ProductEvent, ProductEventContext, ProductEventProcessor } from './ProductEventProcessor';
import { RecommendationEventProcessor } from './RecommendationEventProcessor';
import { UserUpdateEventProcessor } from './UserEventProcessor';

interface MessageMetadata {
  topic: string;
  partition: number;
  offset: string;
}

interface NotificationEvent {
  type: string;
  userId: string;
  data: Record<string, unknown>;
}

export class NotificationProcessorService {
  private deadLetterQueueHandler: DeadLetterQueueHandler;
  private userUpdateEventProcessor: UserUpdateEventProcessor;
  private orderUpdateEventProcessor: OrderUpdateEventProcessor;
  private productEventProcessor: ProductEventProcessor;
  private recommendationEventProcessor: RecommendationEventProcessor;
  private highPriorityConsumer: Consumer;
  private standardPriorityConsumer: Consumer;

  static createNotificationForEvent: (event: NotificationEvent) => Promise<void>;

  constructor() {
    this.deadLetterQueueHandler = new DeadLetterQueueHandler();

    this.userUpdateEventProcessor = new UserUpdateEventProcessor();
    this.orderUpdateEventProcessor = new OrderUpdateEventProcessor();
    this.productEventProcessor = new ProductEventProcessor();
    this.recommendationEventProcessor = new RecommendationEventProcessor();

    // Initialize two priority consumers
    this.highPriorityConsumer = kafka.consumer({
      groupId: 'priority1-notification-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxInFlightRequests: 1,
    });

    this.standardPriorityConsumer = kafka.consumer({
      groupId: 'priority2-notification-group',
      sessionTimeout: 45000,
      heartbeatInterval: 5000,
      maxInFlightRequests: 1,
    });
  }

  /**
   * Connects and starts both high and standard priority consumers
   */
  async initializeEventConsumer(): Promise<void> {
    try {
      await this.setupConsumer(this.highPriorityConsumer, ['user-events', 'order-events']);
      await this.setupConsumer(this.standardPriorityConsumer, [
        'product-events',
        'recommendation-events',
        'promotional-events',
      ]);

      console.log('Kafka Priority Queues Started Successfully', {
        highPriorityTopics: ['user-events', 'order-events'],
        standardPriorityTopics: ['product-events', 'recommendation-events', 'promotional-events'],
      });
    } catch (err) {
      console.error('Failed to initialize Kafka consumers', err);
      throw err;
    }
  }

  private async setupConsumer(consumerInstance: Consumer, topics: string[]): Promise<void> {
    await consumerInstance.connect();
    await consumerInstance.subscribe({ topics, fromBeginning: false });

    await consumerInstance.run({
      eachMessage: async ({ topic, message, partition }) => {
        await this.processMessage(topic, message, partition);
      },
    });
  }

  private async processMessage(
    topic: string,
    message: KafkaMessage,
    partition: number
  ): Promise<void> {
    if (!message.value) {
      console.warn(`Skipping empty message on topic ${topic}`);
      return;
    }

    let event: unknown;
    try {
      event = JSON.parse(message.value.toString());
    } catch (parseErr) {
      const errorMessage = parseErr instanceof Error ? parseErr.message : 'Unknown parse error';
      console.error(`JSON parse error on topic ${topic}:`, errorMessage);
      await this.deadLetterQueueHandler.queueFailedMessage(topic, message.value, {
        originalTopic: topic,
        partition,
        offset: message.offset,
        reason: 'Invalid JSON payload',
      });
      return;
    }

    console.log(`Processing event on topic ${topic}`);

    const metadata: MessageMetadata = { topic, partition, offset: message.offset };

    try {
      const success = await this.handleEventByTopic(topic, event, metadata);
      if (!success) {
        await this.deadLetterQueueHandler.queueFailedMessage(topic, message.value, {
          originalTopic: topic,
          partition,
          offset: message.offset,
          reason: 'Handler returned false',
        });
      }
    } catch (handlerErr) {
      const errorMessage =
        handlerErr instanceof Error ? handlerErr.message : 'Unknown handler error';
      console.error(`Error in handler for ${topic}:`, errorMessage);
      await this.deadLetterQueueHandler.queueFailedMessage(topic, message.value, {
        originalTopic: topic,
        partition,
        offset: message.offset,
        reason: errorMessage,
      });
    }
  }

  private async handleEventByTopic(
    topic: string,
    event: unknown,
    metadata: MessageMetadata
  ): Promise<boolean> {
    switch (topic) {
      case 'user-events':
        return this.userUpdateEventProcessor.processUserUpdateEventWithRetry(
          event as any,
          metadata as any
        );
      case 'order-events':
        return this.orderUpdateEventProcessor.processOrderUpdateEventWithRetry(
          event as any,
          metadata as any
        );
      case 'product-events':
        return this.productEventProcessor.processProductEventWithRetry(
          event as ProductEvent,
          metadata as ProductEventContext
        );
      case 'recommendation-events':
        return this.recommendationEventProcessor.processRecommendationEvent(
          event as any,
          metadata as any
        );
      case 'promotional-events':
        return this.productEventProcessor.processPromotionalEventFromKafka(
          event as any,
          metadata as ProductEventContext
        );
      default:
        console.warn(`No handler registered for topic ${topic}`);
        return false;
    }
  }

  async shutdown(): Promise<void> {
    const disconnectPromises = [
      this.highPriorityConsumer.disconnect(),
      this.standardPriorityConsumer.disconnect(),
      consumer.disconnect(),
      producer.disconnect(),
    ];

    await Promise.all(disconnectPromises);
    console.log('Kafka consumers and producer disconnected.');
  }
}

export const notificationProcessorService = new NotificationProcessorService();
