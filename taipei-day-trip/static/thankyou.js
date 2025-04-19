document.addEventListener("DOMContentLoaded", async () => {
  const message = document.getElementById("thankyouMessage");
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get("number");

  // 統一顯示錯誤訊息
  const showMessage = (text) => {
    message.textContent = text;
  };

  // 檢查是否帶有訂單編號
  if (!orderNumber) {
    showMessage("查無訂單編號。");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("尚未登入，無法查詢訂單資料。");
    return;
  }

  try {
    const res = await fetch(`/api/order/${orderNumber}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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

    // 渲染成功訊息
    message.innerHTML = `
      <h3>感謝您的訂購！</h3>
      <h3>您的訂單編號為：${data.number}</h3>
      <p>請記住此編號，或到會員中心查詢歷史訂單</p>
    `;
  } catch (err) {
    console.error("取得訂單錯誤", err);
    showMessage("系統異常，請稍後再試。");
  }
});


