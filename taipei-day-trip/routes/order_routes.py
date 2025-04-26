from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from controllers.order_controller import create_order_handler, get_order_handler

router = APIRouter()

@router.post("/orders")
async def create_order(request: Request):
    return await create_order_handler(request)

@router.get("/order/{order_number}")
async def get_order(order_number: str, request: Request):
    return await get_order_handler(order_number, request)