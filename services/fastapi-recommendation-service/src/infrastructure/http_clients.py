import os
import requests
from typing import List, Dict


def get_all_users() -> List[Dict]:
    """Fetch all users from the user service."""
    users_service_url = os.getenv("USERS_SERVICE_URL")
    if not users_service_url:
        raise ValueError("USERS_SERVICE_URL environment variable is not set.")
    response = requests.get(f"{users_service_url}/")
    response.raise_for_status()
    return response.json().get("result", [])


def get_all_products() -> List[Dict]:
    """Fetch all products from the product service."""
    products_service_url = os.getenv("PRODUCTS_SERVICE_URL")
    if not products_service_url:
        raise ValueError("PRODUCTS_SERVICE_URL environment variable is not set.")
    response = requests.get(f"{products_service_url}/")
    response.raise_for_status()
    return response.json().get("result", [])


def get_all_orders() -> List[Dict]:
    """Fetch all orders from the order service."""
    orders_service_url = os.getenv("ORDERS_SERVICE_URL")
    if not orders_service_url:
        raise ValueError("ORDERS_SERVICE_URL environment variable is not set.")
    response = requests.get(f"{orders_service_url}/")
    response.raise_for_status()
    return response.json().get("result", [])
