from typing import Optional
from starlette.requests import Request
import bcrypt
import jwt
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from config import settings

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def create_access_token(user_id: int) -> str:
    payload = {"id": user_id}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)

def set_session_token(request: Request, user_id: int):
    request.session["user"] = {"id": user_id}

def get_current_user(token: str = Depends(OAuth2PasswordBearer(tokenUrl="/api/user/auth"))) -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return {"id": payload["id"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token 已過期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=403, detail="權限不足")


def decode_jwt_token(token: str):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token 已過期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="無效的 Token")
    