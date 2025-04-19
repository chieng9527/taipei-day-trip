from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # JWT 設定
    secret_key: str
    algorithm: str = "HS256"
    token_expire_days: int = 7

    # TapPay 設定
    partner_key: str
    merchant_id: str

    # 資料庫設定
    db_host: str
    db_user: str
    db_password: str
    db_name: str
    db_pool_size: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
