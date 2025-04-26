from database.db import get_db_connection

def get_booking_by_user_id(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT b.id, a.name, a.address, a.id AS attraction_id, b.date, b.time, b.price, ai.image_url
        FROM bookings b
        JOIN attractions a ON b.attraction_id = a.id
        LEFT JOIN attraction_images ai ON ai.attraction_id = a.id
        WHERE b.user_id = %s
        LIMIT 1;
    """, (user_id,))
    booking = cursor.fetchone()
    conn.close()

    if booking:
        return {
            "attraction": {
                "id": booking["attraction_id"],
                "name": booking["name"],
                "address": booking["address"],
                "image": booking["image_url"]
            },
            "date": booking["date"],
            "time": booking["time"],
            "price": booking["price"]
        }
    return None

def create_or_update_booking_by_user_id(user_id: int, data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 檢查是否已存在預定
    cursor.execute("SELECT id FROM bookings WHERE user_id = %s", (user_id,))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
            UPDATE bookings
            SET attraction_id=%s, date=%s, time=%s, price=%s
            WHERE user_id=%s
        """, (data["attractionId"], data["date"], data["time"], data["price"], user_id))
    else:
        cursor.execute("""
            INSERT INTO bookings (user_id, attraction_id, date, time, price)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, data["attractionId"], data["date"], data["time"], data["price"]))

    conn.commit()
    conn.close()

def delete_booking_by_user_id(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM bookings WHERE user_id = %s", (user_id,))
    conn.commit()
    conn.close()