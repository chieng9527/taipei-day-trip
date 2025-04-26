from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from controllers.booking_controller import (
    handle_get_booking,
    handle_create_or_update_booking,
    handle_delete_booking
)
from utils.auth import get_current_user
from database.db import get_db_connection

router = APIRouter()

@router.get("/booking")
async def get_booking(user=Depends(get_current_user)):
    booking = handle_get_booking(user["id"])
    return JSONResponse(content={"data": booking}, status_code=200)

@router.post("/booking")
async def post_booking(request: Request, user=Depends(get_current_user)):
    try:
        data = await request.json()
        handle_create_or_update_booking(user["id"], data)
        return JSONResponse(content={"ok": True}, status_code=200)
    except ValueError as e:
        return JSONResponse(content={"error": True, "message": str(e)}, status_code=400)
    except Exception:
        return JSONResponse(content={"error": True, "message": "伺服器內部錯誤"}, status_code=500)

@router.delete("/booking")
async def delete_booking(user=Depends(get_current_user)):
    handle_delete_booking(user["id"])
    return JSONResponse(content={"ok": True}, status_code=200)

@router.get("/booking/user")
async def get_user_info(user=Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT name, email FROM users WHERE id = %s", (user["id"],))
    user_data = cursor.fetchone()
    cursor.close()
    conn.close()

    return JSONResponse(content={"data": user_data}, status_code=200)