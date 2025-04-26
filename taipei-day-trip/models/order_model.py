from database.db import get_db_connection
import mysql.connector
from fastapi import HTTPException
from decimal import Decimal

def insert_order(user_id, attraction_id, date, time, price, contact, order_number, tappay_result):
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
                    order_number, False, tappay_result.get("rec_trade_id")
                )
            )
            conn.commit()

            if tappay_result["status"] == 0:
                cursor.execute(
                    "UPDATE orders SET status = %s WHERE order_number = %s",
                    (True, order_number)
                )
                conn.commit()
    except mysql.connector.Error:
        raise HTTPException(status_code=500, detail="資料庫錯誤")
    finally:
        if conn and conn.is_connected():
            conn.close()

def fetch_order_by_number(order_number, user_id):
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
            """, (order_number, user_id))

            order = cursor.fetchone()

            if order:
                # 將 Decimal 類型轉為 float
                for key, value in order.items():
                    if isinstance(value, Decimal):
                        order[key] = float(value)

            return order

    finally:
        if conn and conn.is_connected():
            conn.close()