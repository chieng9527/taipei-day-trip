from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
from controllers.user_controller import (
    register_user_controller,
    get_user_auth_controller,
    login_user_controller
)
from models.user_model import UserSignup, UserLogin

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/user/auth")

@router.post("/")
def register_user(user: UserSignup):
    return register_user_controller(user)

@router.get("/auth")
def get_user_auth(token: str = Depends(oauth2_scheme)):
    return get_user_auth_controller(token)

@router.put("/auth")
def login_user(user: UserLogin):
    return login_user_controller(user)