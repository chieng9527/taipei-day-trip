from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from config import settings
from database import get_db_connection
import jwt
import datetime
import bcrypt
from typing import Optional  
router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/user/auth")

class UserSignup(BaseModel):
    name: str
    email: EmailStr  
    password: str


    class Config:
        min_anystr_length = 8

class UserLogin(BaseModel):
    email: EmailStr
    password: str

def create_access_token(user_id: int) -> str:
    token_data = {
        "id": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(token_data, settings.secret_key, algorithm=settings.algorithm)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8").decode())

@router.post("/api/user")
def register_user(user: UserSignup):
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("SELECT id FROM users WHERE email = %s", (user.email.lower(),))
        if cursor.fetchone():
            return JSONResponse(
                status_code=400, 
                content={"error": True, "message": "Email已經被註冊"}
            )

        hashed_password = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt())

        insert_query = """
            INSERT INTO users (name, email, password) 
            VALUES (%s, %s, %s)
        """
        cursor.execute(insert_query, 
                      (user.name, user.email.lower(), hashed_password.decode("utf-8")))
        db.commit()

        return {"ok": True}

    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"error": True, "message": "伺服器內部錯誤"}
        )
    
    finally:
        if 'db' in locals() and db.is_connected():
            cursor.close()
            db.close()

@router.get("/api/user/auth")
def get_user_auth(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("id")

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        select_query = """
            SELECT id, name, email 
            FROM users 
            WHERE id = %s
        """
        cursor.execute(select_query, (user_id,))
        user = cursor.fetchone()

        return {"data": user if user else None}

    except jwt.ExpiredSignatureError:
        return {"data": None}
    except jwt.InvalidTokenError:
        return {"data": None}
    finally:
        if 'db' in locals() and db.is_connected():
            cursor.close()
            db.close()

@router.put("/api/user/auth")
def login_user(user: UserLogin):
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        select_query = """
            SELECT id, password 
            FROM users 
            WHERE email = %s
        """
        cursor.execute(select_query, (user.email.lower(),))
        user_data = cursor.fetchone()

        if not user_data or not verify_password(user.password, user_data["password"]):
            return JSONResponse(
                status_code=400, 
                content={"error": True, "message": "電子郵件或密碼錯誤"}
            )

        token = create_access_token(user_data["id"])
        return {"token": token}

    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"error": True, "message": "伺服器內部錯誤"}
        )
    
    finally:
        if 'db' in locals() and db.is_connected():
            cursor.close()
            db.close()