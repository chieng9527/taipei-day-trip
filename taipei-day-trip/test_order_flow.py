import requests

BASE_URL = "http://127.0.0.1:8000"
EMAIL = "123@gmail.com"
PASSWORD = "123"
NAME = "測試用戶"

# 登入／註冊
def signup_and_login():
    try:
        res = requests.post(f"{BASE_URL}/api/user", json={"name": NAME, "email": EMAIL, "password": PASSWORD})
        if res.status_code != 200:
            print(f"註冊跳過（可能已註冊）：{res.status_code}, {res.text}")
    except:
        print("註冊失敗但可忽略")

    # 登入
    res = requests.put(f"{BASE_URL}/api/user/auth", json={"email": EMAIL, "password": PASSWORD})
    try:
        data = res.json()
        print("登入結果：", data)
        if "token" in data:
            return data["token"]
        else:
            raise Exception(f"登入失敗：{data}")
    except Exception as e:
        print("登入或解析錯誤：", e)
        exit()

# 建立 bookings
def create_booking(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post(f"{BASE_URL}/api/booking", json={
        "attractionId": 1,
        "date": "2025-04-20",
        "time": "afternoon",
        "price": 2500
    }, headers=headers)
    print("建立 booking 結果：", res.status_code, res.text)

# 建立訂單
def create_order(token):
    headers = {"Authorization": f"Bearer {token}"}

    res = requests.post(f"{BASE_URL}/api/orders", json={
        "prime": "fake-valid-prime",
        "order": {
            "price": 2500,  
            "trip": {
                "attraction": {
                    "id": 1,
                    "name": "測試景點",
                    "address": "台北市",
                    "image": "https://example.com/image.jpg"
                },
                "date": "2025-04-20",
                "time": "afternoon"
            },
            "contact": {
                "name": NAME,
                "email": EMAIL,
                "phone": "0900000000"
            }
        }
    }, headers=headers)

    try:
        data = res.json()
        print("建立訂單回傳：", data)
        return data["data"]["number"]
    except Exception as e:
        print("建立訂單失敗或格式錯誤：", res.status_code, res.text)
        exit()

# 查詢訂單
def get_order(token, number):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/api/order/{number}", headers=headers)
    print("查詢訂單內容：", res.status_code)
    print(res.json())
    
    data = res.json()["data"]
    assert data["price"] == 2500
    assert data["trip"]["attraction"]["id"] == 1
    assert data["trip"]["date"] == "2025-04-20"
    assert data["trip"]["time"] == "afternoon"
    assert data["contact"]["name"] == NAME
    assert data["contact"]["email"] == EMAIL
    print("訂單內容驗證成功")

if __name__ == "__main__":
    token = signup_and_login()
    create_booking(token)
    order_number = create_order(token)
    get_order(token, order_number)