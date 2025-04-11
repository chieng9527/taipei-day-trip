from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database import get_db_connection
from config import settings
import jwt

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/user/auth")

# 資料模型
class BookingCreate(BaseModel):
    attractionId: int  #  camelCase 
    date: date
    time: str  # "morning" or "afternoon"
    price: int

class BookingResponse(BaseModel):
    id: int
    attractionId: int
    date: date
    time: str
    price: int
    name: str
    address: str
    image: str

# 工具函數
def get_user_id_from_token(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload["id"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# API 端點
@router.get("/api/booking")
async def get_booking(token: str = Depends(oauth2_scheme)):
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    user_id = payload["id"]
    
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("SELECT name, email FROM users WHERE id = %s", (user_id,))
        user_info = cursor.fetchone()
        user_name = user_info["name"] if user_info else ""
        user_email = user_info["email"] if user_info else ""
        
        # 根據您的資料庫結構調整的查詢
        cursor.execute("""
            SELECT 
                b.id,
                b.attraction_id AS attractionId,
                b.date,
                b.time,
                b.price,
                a.name,
                a.address,
                (SELECT image_url FROM attraction_images WHERE attraction_id = a.id LIMIT 1) AS image
            FROM bookings b
            JOIN attractions a ON b.attraction_id = a.id
            WHERE b.user_id = %s
            LIMIT 1
        """, (user_id,))
        
        booking = cursor.fetchone()
        
        if not booking:
            return {"data": None}
            
        return {
            "data": {
                "attraction": {
                    "id": booking["attractionId"],
                    "name": booking["name"],
                    "address": booking["address"],
                    "image": booking["image"]
                },
                "date": booking["date"],
                "time": booking["time"],
                "price": booking["price"],
                "contact": {
                    "name": user_name,
                    "email": user_email
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="伺服器內部錯誤")
    finally:
        if 'db' in locals() and db.is_connected():
            cursor.close()
            db.close()

@router.post("/api/booking")
async def create_booking(booking_data: BookingCreate, token: str = Depends(oauth2_scheme)):
    user_id = get_user_id_from_token(token)
    
    # 驗證時間和價格是否匹配
    if booking_data.time not in ["morning", "afternoon"]:
        raise HTTPException(status_code=400, detail="Invalid time value")
    
    if (booking_data.time == "morning" and booking_data.price != 2000) or \
       (booking_data.time == "afternoon" and booking_data.price != 2500):
        raise HTTPException(status_code=400, detail="Price and time mismatch")
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # 檢查景點是否存在
        cursor.execute("SELECT id FROM attractions WHERE id = %s", (booking_data.attractionId,))
        if not cursor.fetchone():
            raise HTTPException(status_code=400, detail="景點不存在")
        
        # 使用 REPLACE INTO 
        cursor.execute("""
            INSERT INTO bookings (user_id, attraction_id, date, time, price)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                attraction_id = VALUES(attraction_id),
                date = VALUES(date),
                time = VALUES(time),
                price = VALUES(price)
        """, (
            user_id,
            booking_data.attractionId,
            booking_data.date,
            booking_data.time,
            booking_data.price
        ))
        
        db.commit()
        return {"ok": True}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="伺服器內部錯誤")
    finally:
        if 'db' in locals() and db.is_connected():
            cursor.close()
            db.close()

@router.delete("/api/booking")
async def delete_booking(token: str = Depends(oauth2_scheme)):
    user_id = get_user_id_from_token(token)
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("DELETE FROM bookings WHERE user_id = %s", (user_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=400, detail="找不到預定行程")
            
        db.commit()
        return {"ok": True}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="伺服器內部錯誤")
    finally:
        if 'db' in locals() and db.is_connected():
            cursor.close()
            db.close()