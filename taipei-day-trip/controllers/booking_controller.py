from datetime import date
from models.booking_model import (
    get_booking_by_user_id,
    create_or_update_booking_by_user_id,
    delete_booking_by_user_id
)
from database.db import get_db_connection

def handle_get_booking(user_id: int):
    data = get_booking_by_user_id(user_id)
    if data and isinstance(data.get("date"), date):
        data["date"] = str(data["date"])  # 轉成 ISO 格式
    return data

def handle_create_or_update_booking(user_id: int, data: dict):
    if not data.get("attractionId") or not data.get("date") or not data.get("time") or not data.get("price"):
        raise ValueError("缺少必要欄位")

    # 驗證日期不可早於今天
    booking_date = date.fromisoformat(data["date"])
    if booking_date < date.today():
        raise ValueError("無法預約過去的日期")

    # 驗證時段只能是 morning 或 afternoon
    if data["time"] not in ["morning", "afternoon"]:
        raise ValueError("時段只能為 'morning' 或 'afternoon'")

    # 驗證價格只能是 2000 或 2500
    if data["price"] not in [2000, 2500]:
        raise ValueError("價格必須為 2000 或 2500")

    # attractionId 必須存在
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM attractions WHERE id = %s", (data["attractionId"],))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if not result:
        raise ValueError("景點編號不存在")

    return create_or_update_booking_by_user_id(user_id, data)

def handle_delete_booking(user_id: int):
    return delete_booking_by_user_id(user_id)