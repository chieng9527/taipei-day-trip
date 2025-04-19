import uuid 
import requests
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse
from database import get_db_connection
from users import decode_jwt_token  # 假設你已有解析 token 函數
from config import settings
import traceback
import mysql.connector

router = APIRouter()


@router.post("/api/orders")
async def create_order(request: Request):
    try:
        # 取得請求的 JSON 資料
        body = await request.json()
        prime = body.get("prime")
        order = body.get("order")

        # 檢查 prime 和 order 是否存在
        if not prime or not order:
            raise HTTPException(status_code=400, detail="缺少 prime 或 order 資料")

        # 驗證使用者的 JWT token
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

        # 發送付款請求
        tappay_response = requests.post(
            "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime",
            headers={
                "content-type": "application/json",
                "x-api-key": settings.partner_key  
            },
            json=tappay_payload
        )
        tappay_result = tappay_response.json()

        # 嘗試寫入訂單到資料庫
        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO orders (
                        user_id, attraction_id, date, time, price,
                        contact_name, contact_email, contact_phone,
                        order_number, status, rec_trade_id
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        user_id, attraction_id, date, time, price,
                        contact["name"], contact["email"], contact["phone"],
                        order_number, False, tappay_result.get("rec_trade_id")  # 初始狀態為 False
                    )
                )
                conn.commit()

                # 根據付款結果更新訂單狀態
                if tappay_result["status"] == 0:
                    cursor.execute(
                        "UPDATE orders SET status = %s WHERE order_number = %s",
                        (True, order_number)
                    )
                    conn.commit()
                else:
                    raise HTTPException(status_code=400, detail="付款失敗")

        except mysql.connector.Error as db_error:
            raise HTTPException(status_code=500, detail="資料庫錯誤")
        finally:
            if conn and conn.is_connected():
                conn.close()

        return JSONResponse(content={"data": {"number": order_number}})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"建立訂單失敗: {str(e)}")
    
@router.get("/api/order/{order_number}")
async def get_order(order_number: str, request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = decode_jwt_token(token)
    if not user:
        raise HTTPException(status_code=403, detail="未授權")

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute("""
                SELECT o.*, a.name AS attraction_name, a.address,
                       (SELECT image_url FROM attraction_images WHERE attraction_id = o.attraction_id LIMIT 1) AS image
                FROM orders o
                JOIN attractions a ON o.attraction_id = a.id
                WHERE o.order_number = %s AND o.user_id = %s
            """, (order_number, user["id"]))
            order = cursor.fetchone()
    except mysql.connector.Error:
        raise HTTPException(status_code=500, detail="資料庫錯誤")
    finally:
        if conn and conn.is_connected():
            conn.close()

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