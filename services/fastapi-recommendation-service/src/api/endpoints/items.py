from fastapi import APIRouter, HTTPException, Depends
from typing import List

router = APIRouter()


async def get_item_service():
    pass

@router.get("/")
async def get_items(
    skip: int = 0,
    limit: int = 100,
):
    """Get all items with pagination"""
    return await True
