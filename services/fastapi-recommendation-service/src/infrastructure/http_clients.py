import os
import requests
import json
from typing import List, Dict
from .redis import get_redis_client

redis_client = get_redis_client()


def get_all_users() -> List[Dict]:
    """Fetch all users from the user service."""
    users_service_url = os.getenv("USERS_SERVICE_URL")
    if not users_service_url:
        raise ValueError("USERS_SERVICE_URL environment variable is not set.")
    if redis_client.exists("all_users"):
        cached_users = redis_client.get("all_users")
        if cached_users:
            return json.loads(cached_users)
    else:
        response = requests.get(f"{users_service_url}/")
        response.raise_for_status()
        users = response.json().get("result", [])
        redis_client.set("all_users", json.dumps(users))
        return users


def get_all_products() -> List[Dict]:
    """Fetch all products from the product service."""
    products_service_url = os.getenv("PRODUCTS_SERVICE_URL")
    if not products_service_url:
        raise ValueError("PRODUCTS_SERVICE_URL environment variable is not set.")
    if redis_client.exists("all_products"):
        cached_products = redis_client.get("all_products")
        if cached_products:
            return json.loads(cached_products)      
    else:
        response = requests.get(f"{products_service_url}/")
        response.raise_for_status()
        products = response.json().get("result", [])
        redis_client.set("all_products", json.dumps(products))
        return products


def get_all_orders() -> List[Dict]:
    """Fetch all orders from the order service."""
    orders_service_url = os.getenv("ORDERS_SERVICE_URL")
    if not orders_service_url:
        raise ValueError("ORDERS_SERVICE_URL environment variable is not set.")
    if redis_client.exists("all_orders"):
        cached_orders = redis_client.get("all_orders")
        if cached_orders:
            return json.loads(cached_orders)
    else:
        response = requests.get(f"{orders_service_url}/")
        response.raise_for_status()
        orders = response.json().get("result", [])
        redis_client.set("all_orders", json.dumps(orders))
    return orders
