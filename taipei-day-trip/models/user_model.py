from pydantic import BaseModel, EmailStr
import bcrypt
import jwt
import datetime
from config import settings

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

    class Config:
        str_min_length = 2

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
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))