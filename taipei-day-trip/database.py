from mysql.connector import pooling
from config import settings

db_pool = pooling.MySQLConnectionPool(
    pool_name="my_pool",
    pool_size=settings.db_pool_size,
    host=settings.db_host,
    user=settings.db_user,
    password=settings.db_password,
    database=settings.db_name,
    autocommit=False
)

def get_db_connection():
    try:
        return db_pool.get_connection()
    except Exception as e:
        print("取得資料庫連線失敗:", str(e))
        raise