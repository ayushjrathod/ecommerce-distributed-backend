import numpy as np
from sklearn.decomposition import TruncatedSVD
from typing import List, Dict
from ..infrastructure.http_clients import get_all_users, get_all_products, get_all_orders

def build_user_item_matrix(users: List[Dict], products: List[Dict], orders: List[Dict]):
    user_ids = {user['_id']: i for i, user in enumerate(users)}
    product_ids = {product['_id']: i for i, product in enumerate(products)}
    
    num_users = len(user_ids)
    num_products = len(product_ids)
    
    matrix = np.zeros((num_users, num_products))
    
    for order in orders:
        user_id = order.get("userId")
        if user_id in user_ids:
            user_idx = user_ids[user_id]
            for product in order.get("products", []):
                product_id = product.get("_id")
                if product_id in product_ids:
                    product_idx = product_ids[product_id]
                    matrix[user_idx, product_idx] += 1
                    
    return matrix, user_ids, product_ids

def train_svd_model(matrix, n_components=50):
    n_features = matrix.shape[1]
    if n_features <= n_components:
        n_components = n_features - 1
    
    if n_components <= 0:
        print("Not enough features to train SVD model.")
        return None

    svd = TruncatedSVD(n_components=n_components, random_state=42)
    svd.fit(matrix)
    return svd

def get_recommendations_for_user(user_id: str, model, user_item_matrix, user_ids: Dict, product_ids: Dict, products: List[Dict], top_n=5) -> List[Dict]:
    if model is None:
        return []
        
    if user_id not in user_ids:
        return []

    user_idx = user_ids[user_id]
    user_ratings = user_item_matrix[user_idx, :]
    
    predicted_ratings = model.inverse_transform(model.transform(user_ratings.reshape(1, -1)))
    
    interacted_product_indices = np.where(user_ratings > 0)[0]
    
    predicted_ratings[0, interacted_product_indices] = -np.inf
    
    top_product_indices = np.argsort(predicted_ratings[0])[::-1][:top_n]
    
    product_id_map = {v: k for k, v in product_ids.items()}
    recommended_product_ids = [product_id_map[i] for i in top_product_indices if i in product_id_map]
    
    recommendations = [p for p in products if p['_id'] in recommended_product_ids]
    
    return recommendations
