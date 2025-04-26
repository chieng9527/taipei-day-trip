from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.sessions import SessionMiddleware
from config import settings

# === 導入路由 ===
from routes.user_routes import router as user_router
from routes.booking_routes import router as booking_router
from routes.order_routes import router as order_router
from routes.attraction_routes import router as attraction_router

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi import Request


# 自定義 StaticFiles 以加上長效 Cache-Control header
class CacheControlStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        if response.status_code == 200:
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)  # 壓縮大於1kb的回應

# === 靜態頁面路由 ===
@app.get("/", include_in_schema=False)
async def index(request: Request):
    return FileResponse("./templates/index.html", media_type="text/html")

@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
    return FileResponse("./templates/attraction.html", media_type="text/html")

@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
    return FileResponse("./templates/booking.html", media_type="text/html")

@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
    return FileResponse("./templates/thankyou.html", media_type="text/html")

# === 掛載靜態資源 ===
app.mount("/static", CacheControlStaticFiles(directory="static"), name="static")

# === 註冊 SessionMiddleware（用於處理 session）===
app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)

# === 註冊 API 路由（MVC：Controller 對應 View）===
app.include_router(user_router, prefix="/api/user", tags=["User"])
app.include_router(booking_router, prefix="/api", tags=["Booking"])
app.include_router(order_router, prefix="/api", tags=["Order"])
app.include_router(attraction_router, prefix="/api", tags=["Attraction"])
