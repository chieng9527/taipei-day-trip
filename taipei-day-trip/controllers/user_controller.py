# controllers/user_controller.py
from fastapi.responses import JSONResponse
from models.user_model import UserSignup, UserLogin, verify_password, create_access_token
from utils.auth import decode_jwt_token
from database.db import get_db_connection
import bcrypt
import jwt

def register_user_controller(user: UserSignup):
    db = None
    cursor = None
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT id FROM users WHERE email = %s", (user.email.lower(),))
        if cursor.fetchone():
            return JSONResponse(status_code=400, content={"error": True, "message": "Email已經被註冊"})

        hashed_password = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt())
        insert_query = "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)"
        cursor.execute(insert_query, (user.name, user.email.lower(), hashed_password.decode("utf-8")))
        db.commit()
        return {"ok": True}
    except:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()

def get_user_auth_controller(token: str):
    db = None
    cursor = None
    try:
        payload = decode_jwt_token(token)  # 例外由 utils/auth.py 負責
        user_id = payload.get("id")

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        return {"data": user if user else None}
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()

def login_user_controller(user: UserLogin):
    db = None
    cursor = None
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email, password FROM users WHERE email = %s", (user.email.lower(),))
        user_data = cursor.fetchone()
        if not user_data or not verify_password(user.password, user_data["password"]):
            return JSONResponse(status_code=400, content={"error": True, "message": "電子郵件或密碼錯誤"})
        token = create_access_token(user_data["id"])
        return {"token": token}
    except:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()