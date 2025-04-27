export const DOM = {
  message: document.getElementById("thankyouMessage"),
};

export function showMessage(text) {
  if (DOM.message) {
    DOM.message.textContent = text;
  }
}

export function renderOrderSuccess(data) {
  if (!DOM.message) return;
  DOM.message.innerHTML = `
    <h3>感謝您的訂購！</h3>
    <h3>您的訂單編號為：${data.number}</h3>
    <p>總金額：NT$${data.price || "未提供"}</p>
    <p>請記住此編號，或到會員中心查詢歷史訂單</p>
  `;
}