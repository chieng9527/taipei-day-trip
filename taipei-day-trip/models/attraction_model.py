from database.db import get_db_connection
from decimal import Decimal

def fetch_attractions(page: int, keyword: str, per_page: int = 12):
    offset = page * per_page
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        keyword = keyword.strip() if keyword else None
        keyword_like = f"%{keyword}%" if keyword else None

        # 查詢總數
        if keyword:
            cursor.execute(
                """
                SELECT COUNT(*) AS total
                FROM attractions a
                LEFT JOIN mrt_stations m ON a.mrt_id = m.id
                WHERE a.name LIKE %s OR a.category LIKE %s OR m.name LIKE %s
                """,
                (keyword_like, keyword_like, keyword_like)
            )
        else:
            cursor.execute("SELECT COUNT(*) AS total FROM attractions")

        total = cursor.fetchone()["total"]

        # 查詢景點資料
        if keyword:
            cursor.execute(
                """
                SELECT a.id, a.name, a.category, a.description, a.address, a.transport, 
                       m.name AS mrt, a.latitude, a.longitude,
                       GROUP_CONCAT(i.image_url SEPARATOR ',') AS images
                FROM attractions a
                LEFT JOIN attraction_images i ON a.id = i.attraction_id
                LEFT JOIN mrt_stations m ON a.mrt_id = m.id
                WHERE a.name LIKE %s OR a.category LIKE %s OR m.name LIKE %s
                GROUP BY a.id
                LIMIT %s OFFSET %s
                """,
                (keyword_like, keyword_like, keyword_like, per_page, offset)
            )
        else:
            cursor.execute(
                """
                SELECT a.id, a.name, a.category, a.description, a.address, a.transport, 
                       m.name AS mrt, a.latitude, a.longitude,
                       GROUP_CONCAT(i.image_url SEPARATOR ',') AS images
                FROM attractions a
                LEFT JOIN attraction_images i ON a.id = i.attraction_id
                LEFT JOIN mrt_stations m ON a.mrt_id = m.id
                GROUP BY a.id
                LIMIT %s OFFSET %s
                """,
                (per_page, offset)
            )

        rows = cursor.fetchall()
        results = []

        for row in rows:
            row["images"] = row["images"].split(",") if row["images"] else []

            for key, value in row.items():
                if isinstance(value, Decimal):
                    row[key] = float(value)

            results.append(row)

        next_page = page + 1 if (offset + per_page) < total else None
        return {"results": results, "next_page": next_page}

    finally:
        cursor.close()
        conn.close()

def fetch_attraction_by_id(attraction_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT a.id, a.name, a.category, a.description, a.address, 
                   a.transport, m.name AS mrt, a.latitude, a.longitude,
                   GROUP_CONCAT(i.image_url SEPARATOR ',') AS images
            FROM attractions a
            LEFT JOIN attraction_images i ON a.id = i.attraction_id
            LEFT JOIN mrt_stations m ON a.mrt_id = m.id
            WHERE a.id = %s
            GROUP BY a.id
        """
        cursor.execute(query, (attraction_id,))
        attraction = cursor.fetchone()

        if attraction:
            attraction["images"] = attraction["images"].split(",") if attraction["images"] else []
            # 🔄 Decimal 轉換為 float，避免 JSON 錯誤
            for key, value in attraction.items():
                if isinstance(value, Decimal):
                    attraction[key] = float(value)

        return attraction

    finally:
        cursor.close()
        conn.close()

def fetch_mrts():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT m.name, COUNT(a.id) AS attraction_count 
            FROM mrt_stations m
            LEFT JOIN attractions a ON m.id = a.mrt_id
            GROUP BY m.name
            ORDER BY attraction_count DESC, m.name ASC
        """
        cursor.execute(query)
        results = [row["name"] for row in cursor.fetchall()]
        return results

    finally:
        cursor.close()
        conn.close()