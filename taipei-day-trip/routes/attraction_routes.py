from fastapi import APIRouter, Query
from typing import Optional
from controllers.attraction_controller import get_attractions_controller
from controllers.attraction_controller import get_attraction_by_id_controller
from controllers.attraction_controller import get_mrts_controller



router = APIRouter()

@router.get("/")
def get_attractions(page: int = Query(0, ge=0), keyword: Optional[str] = None):
    return get_attractions_controller(page, keyword)

@router.get("/attractions")
def get_attractions(page: int = 0, keyword: str = None):
    return get_attractions_controller(page, keyword)

@router.get("/attraction/{attraction_id}")
def get_attraction_by_id(attraction_id: int):
    return get_attraction_by_id_controller(attraction_id)

@router.get("/mrts")
def get_mrts():
    return get_mrts_controller()