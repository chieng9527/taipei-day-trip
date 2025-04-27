import { fetchOrderData } from "../thankyou/thankyouModel.js";
import { DOM, showMessage, renderOrderSuccess } from "../thankyou/thankyouView.js";

export async function initThankyouPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get("number");

  if (!orderNumber) {
    showMessage("查無訂單編號。");
    return;
  }

  showMessage("載入中...");

  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("尚未登入，無法查詢訂單資料。請登入後重試。");
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
    return;
  }

  try {
    const res = await fetchOrderData(orderNumber, token);

    if (!res.ok) {
      showMessage(
        res.status === 401
          ? "登入憑證過期，請重新登入後再查詢。"
          : "訂單查詢失敗，請稍後再試。"
      );
      return;
    }

    let result;
    try {
      result = await res.json();
    } catch (jsonErr) {
      console.error("JSON 解析錯誤", jsonErr);
      showMessage("伺服器錯誤，請稍後再試。");
      return;
    }

    const data = result.data;
    if (!data) {
      showMessage("查無訂單資料。");
      return;
    }

    renderOrderSuccess(data);

  } catch (err) {
    console.error("取得訂單錯誤", err);
    showMessage("系統異常，請稍後再試。");
  }
}