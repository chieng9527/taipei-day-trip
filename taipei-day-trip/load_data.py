import json
import mysql.connector
from mysql.connector import Error

#  配置文件
DB_CONFIG = {
    "host": "localhost",
    "user": "wehelp_123",
    "password": "wehelp_456",
    "database": "taipei_trip"
}

#  讀取 JSON 檔案
def load_json_data(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)["result"]["results"]

#  插入 MRT 站數據
def insert_mrt_station(cursor, mrt_name, mrt_dict):
    if mrt_name and mrt_name not in mrt_dict:
        cursor.execute("SELECT id FROM mrt_stations WHERE name = %s", (mrt_name,))
        result = cursor.fetchone()
        if result:
            mrt_dict[mrt_name] = result[0]  # 記錄捷運站 ID
        else:
            cursor.execute("INSERT INTO mrt_stations (name) VALUES (%s)", (mrt_name,))
            mrt_dict[mrt_name] = cursor.lastrowid  # 插入新捷運站並記錄 ID
    return mrt_dict.get(mrt_name)

#  插入景點數據
def insert_attraction(cursor, item, mrt_id):
    cursor.execute("""
        INSERT INTO attractions (name, category, description, address, transport, mrt_id, latitude, longitude) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        item["name"],
        item["CAT"],
        item["description"],
        item["address"],
        item["direction"],
        mrt_id,  # 確保 mrt_id 被正確賦值
        float(item["latitude"]),
        float(item["longitude"])
    ))
    return cursor.lastrowid

#  插入圖片數據
def insert_images(cursor, attraction_id, images):
    valid_images = ["https://" + url for url in images if url.endswith(("JPG", "jpg", "PNG", "png"))]
    if valid_images:
        cursor.executemany(
            "INSERT INTO attraction_images (attraction_id, image_url) VALUES (%s, %s)",
            [(attraction_id, img_url) for img_url in valid_images]
        )

#  主函數
def main():
    try:
        #  連接 MySQL
        db = mysql.connector.connect(**DB_CONFIG)
        cursor = db.cursor()

        #  讀取 JSON 數據
        data = load_json_data("data/taipei-attractions.json")

        #  建立 MRT 站名稱對應 ID 字典
        mrt_dict = {}

        #  解析每筆景點資料
        for item in data:
            mrt_name = item["MRT"]
            mrt_id = insert_mrt_station(cursor, mrt_name, mrt_dict)  # 插入或獲取捷運站 ID
            attraction_id = insert_attraction(cursor, item, mrt_id)  # 插入景點數據
            images = item["file"].split("https://")  # 處理圖片 URL
            insert_images(cursor, attraction_id, images)  # 插入圖片數據

        #  提交變更 & 關閉連線
        db.commit()
        print(" 資料導入完成！")

    except Error as e:
        print(f" 數據庫錯誤: {e}")
    finally:
        if db.is_connected():
            cursor.close()
            db.close()

if __name__ == "__main__":
    main()