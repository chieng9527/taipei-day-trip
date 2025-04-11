from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from config import settings
from typing import Optional
from fastapi.staticfiles import StaticFiles
from database import get_db_connection
from users import router as user_router
from booking import router as booking_router

app = FastAPI()
app.include_router(booking_router)
app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)

# 靜態頁面路由
@app.get("/", include_in_schema=False)
async def index(request: Request):
    return FileResponse("./static/index.html", media_type="text/html")

@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
    return FileResponse("./static/attraction.html", media_type="text/html")

@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
    return FileResponse("./static/booking.html", media_type="text/html")

@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
    return FileResponse("./static/thankyou.html", media_type="text/html")

app.mount("/static", StaticFiles(directory="static"), name="static")

# 加入使用者路由
app.include_router(user_router)

# API 1: 取得所有景點（支援分頁 & 關鍵字搜尋）
@app.get("/api/attractions")
def get_attractions(page: int = Query(0, ge=0), keyword: Optional[str] = None):
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        limit = 12  # 每頁 12 筆
        offset = page * limit  # 計算起始位置

        # 計算符合關鍵字搜索條件的總結果數
        if keyword and keyword.strip():
            count_query = """
                SELECT COUNT(*) AS total
                FROM attractions a
                LEFT JOIN mrt_stations m ON a.mrt_id = m.id
                WHERE a.name LIKE %s OR m.name LIKE %s
            """
            cursor.execute(count_query, (f"%{keyword}%", f"%{keyword}%"))
        else:
            count_query = "SELECT COUNT(*) AS total FROM attractions"
            cursor.execute(count_query)

        total_count = cursor.fetchone()["total"]

        # 執行分頁查詢
        if keyword and keyword.strip():
            query = """
                SELECT a.id, a.name, a.category, a.description, a.address, 
                       a.transport, m.name AS mrt, a.latitude, a.longitude,
                       GROUP_CONCAT(i.image_url SEPARATOR ',') AS images
                FROM attractions a
                LEFT JOIN attraction_images i ON a.id = i.attraction_id
                LEFT JOIN mrt_stations m ON a.mrt_id = m.id
                WHERE a.name LIKE %s OR m.name LIKE %s
                GROUP BY a.id
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (f"%{keyword}%", f"%{keyword}%", limit, offset))
        else:
            query = """
                SELECT a.id, a.name, a.category, a.description, a.address, 
                       a.transport, m.name AS mrt, a.latitude, a.longitude,
                       GROUP_CONCAT(i.image_url SEPARATOR ',') AS images
                FROM attractions a
                LEFT JOIN attraction_images i ON a.id = i.attraction_id
                LEFT JOIN mrt_stations m ON a.mrt_id = m.id
                GROUP BY a.id
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (limit, offset))

        results = cursor.fetchall()
        for attraction in results:
            attraction["images"] = attraction["images"].split(",") if attraction["images"] else []

        # 根據總結果數判斷 nextPage
        next_page = page + 1 if offset + limit < total_count else None

        return {"nextPage": next_page, "data": results}
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
    
    finally:
        if db.is_connected():
            cursor.close()
            db.close()

# API 2: 取得單一景點資訊
@app.get("/api/attraction/{attractionId}")
def get_attraction(attractionId: int):
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

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
        cursor.execute(query, (attractionId,))
        attraction = cursor.fetchone()

        if not attraction:
            return JSONResponse(status_code=400, content={"error": True, "message": "景點編號不正確"})

        attraction["images"] = attraction["images"].split(",") if attraction["images"] else []
        return {"data": attraction}
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
    
    finally:
        if db.is_connected():
            cursor.close()
            db.close()

# API 3: 取得所有捷運站名稱，按照週邊景點數量排序
@app.get("/api/mrts")
def get_mrts():
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        query = """
            SELECT m.name, COUNT(a.id) AS attraction_count 
            FROM mrt_stations m
            LEFT JOIN attractions a ON m.id = a.mrt_id
            GROUP BY m.name
            ORDER BY attraction_count DESC, m.name ASC
        """
        cursor.execute(query)
        results = [row["name"] for row in cursor.fetchall()]

        return {"data": results}
    
    except Exception as e:
        return JSONResponse(
            status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
    
    finally:
        if db.is_connected():
            cursor.close()
            db.close()