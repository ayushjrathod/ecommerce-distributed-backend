from kafka import KafkaProducer, KafkaConsumer
import os 
import dotenv

dotenv.load_dotenv()


producer = KafkaProducer(
    bootstrap_servers=os.getenv("KAFKA_BROKERS").split(","),
    client_id="recommendation-events",
)

consumer = KafkaConsumer(
    "recommendation-events",
    bootstrap_servers=os.getenv("KAFKA_BROKERS").split(","),
    group_id="users",
)
    
