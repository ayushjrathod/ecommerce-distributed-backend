import os
import json
from .collaborative_filtering import (
    get_all_users,
    get_all_products,
    get_all_orders,
    build_user_item_matrix,
    train_svd_model,
    get_recommendations_for_user,
)
from ..infrastructure.kafka import producer



def genrateRecommendations():
    """
    Generates recommendations for all users based on collaborative filtering
    and sends them to a Kafka topic.
    """
    try:
        print("Fetching data for recommendation model...")
        users = get_all_users()
        products = get_all_products()
        orders = get_all_orders()

        if not users or not products or not orders:
            print("Not enough data to generate recommendations.")
            return []

        print("Building user-item matrix...")
        user_item_matrix, user_ids, product_ids = build_user_item_matrix(users, products, orders)

        print("Training SVD model...")
        svd_model = train_svd_model(user_item_matrix)

        all_recommendations = []

        print("Generating recommendations for each user...")
        for user in users:
            user_id = user.get("_id")
            recommendations = get_recommendations_for_user(
                user_id, svd_model, user_item_matrix, user_ids, product_ids, products
            )

            if recommendations:
                message_payload = {
                    'type': 'RECOMMENDATIONS',
                    'userId': user_id,
                    'recommendations': recommendations,
                }
                producer.send('recommendation-events', value=json.dumps(message_payload).encode('utf-8'))
                all_recommendations.append(recommendations)
                print(f"Sent recommendations for user {user_id}")

        # For the purpose of returning something similar to the old function
        return all_recommendations[-1] if all_recommendations else []

    except Exception as e:
        print(f"An error occurred during recommendation generation: {e}")
        return []
