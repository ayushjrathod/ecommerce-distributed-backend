from .kafka import consumer
from .redis import get_redis_client

redis_client = get_redis_client()


consumer.subscribe(['order-events', 'user-events', 'product-events','inventory-events'])

for message in consumer:
  try:
    if message.topic == 'order-events':
      redis_client.delete("all_orders")
    elif message.topic == 'user-events':
      redis_client.delete("all_users")
    elif message.topic == 'product-events':
      redis_client.delete("all_products")
    elif message.topic == 'inventory-events':
      redis_client.delete("all_products")
      redis_client.delete("all_orders")
    else:
      print(f"Unknown topic: {message.topic}")
  except Exception as e:
    print(f"Error processing message from topic {message.topic}: {e}")
  