# controllers/order_controller.py
import uuid
import requests
import traceback
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from utils.auth import decode_jwt_token
from models.order_model import insert_order, fetch_order_by_number
from config import settings

async def create_order_handler(request: Request):
    try:
        body = await request.json()
        prime = body.get("prime")
        order = body.get("order")

        if not prime or not order:
            raise HTTPException(status_code=400, detail="缺少 prime 或 order 資料")

        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        user = decode_jwt_token(token)
        if not user:
            raise HTTPException(status_code=403, detail="未授權")

        user_id = user["id"]
        attraction = order["trip"]["attraction"]
        attraction_id = attraction["id"]
        date = order["trip"]["date"]
        time = order["trip"]["time"]
        price = order["price"]
        contact = order["contact"]

        order_number = str(uuid.uuid4().hex[:16])
        tappay_payload = {
            "prime": prime,
            "partner_key": settings.partner_key,
            "merchant_id": settings.merchant_id,
            "amount": price,
            "details": "Taipei Day Trip Order",
            "cardholder": {
                "phone_number": contact["phone"],
                "name": contact["name"],
                "email": contact["email"]
            },
            "remember": False
        }

        tappay_response = requests.post(
            "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime",
            headers={
                "content-type": "application/json",
                "x-api-key": settings.partner_key
            },
            json=tappay_payload
        )
        tappay_result = tappay_response.json()

        insert_order(user_id, attraction_id, date, time, price, contact, order_number, tappay_result)

        if tappay_result["status"] != 0:
            raise HTTPException(status_code=400, detail="付款失敗")

        return JSONResponse(content={"data": {"number": order_number}})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"建立訂單失敗: {str(e)}")

async def get_order_handler(order_number: str, request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = decode_jwt_token(token)
    if not user:
        raise HTTPException(status_code=403, detail="未授權")

    order = fetch_order_by_number(order_number, user["id"])
    if not order:
        return JSONResponse(content={"data": None})

    return JSONResponse(content={
        "data": {
            "number": order["order_number"],
            "price": order["price"],
            "trip": {
                "attraction": {
                    "id": order["attraction_id"],
                    "name": order["attraction_name"],
                    "address": order["address"],
                    "image": order["image"]
                },
                "date": order["date"].strftime("%Y-%m-%d"),
                "time": order["time"]
            },
            "contact": {
                "name": order["contact_name"],
                "email": order["contact_email"],
                "phone": order["contact_phone"]
            },
            "status": 1 if order["status"] else 0
        }
    })