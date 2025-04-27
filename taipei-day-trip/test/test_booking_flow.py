import requests
import json

# 配置設定
BASE_URL = "http://127.0.0.1:8000"
EMAIL = "123@gmail.com"
PASSWORD = "123"  

# 測試資料
booking_payload = {
    "attractionId": 1,
    "date": "2025-04-15",
    "time": "morning",
    "price": 2000
}

def login_and_get_token():
    res = requests.put( 
        f"{BASE_URL}/api/user/auth",
        json={"email": EMAIL, "password": PASSWORD}
    )
    print("登入響應:", res.status_code, res.text)  
    assert res.status_code == 200, f"登入失敗，狀態碼: {res.status_code}"
    token = res.json().get("token")
    assert token, "未收到 token"
    print("登入成功，JWT token:", token[:20] + "...")  
    return token


def create_booking(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post(f"{BASE_URL}/api/booking", json=booking_payload, headers=headers)
    assert res.status_code == 200, f"建立預定失敗，狀態碼: {res.status_code}"
    print("預定行程建立成功")

def get_booking(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/api/booking", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    if data:
        assert "attraction" in data
        assert "date" in data
        assert "time" in data
        assert "price" in data
        assert "id" in data["attraction"]  # attraction.id
        assert "name" in data["attraction"]
    print("取得預定行程成功:", data)

def delete_booking(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.delete(f"{BASE_URL}/api/booking", headers=headers)
    assert res.status_code == 200
    print("預定行程刪除成功")

def check_booking_deleted(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/api/booking", headers=headers)
    assert res.status_code == 200
    assert res.json()["data"] is None
    print("確認預定行程已刪除")

def test_booking_flow():
    try:
        print("\n=== 測試開始 ===")
        token = login_and_get_token()
        
        print("\n[測試階段 1] 建立預訂")
        create_booking(token)
        get_booking(token)
        
        print("\n[測試階段 2] 刪除後驗證")
        delete_booking(token)
        check_booking_deleted(token)
        
        print("\n=== 測試全部通過 ===")
    except Exception as e:
        print(f"\n!!! 測試失敗: {str(e)}")
        raise

if __name__ == "__main__":
    test_booking_flow()