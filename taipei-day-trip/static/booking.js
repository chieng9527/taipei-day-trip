// 常量定義
const API = {
  BOOKING: "/api/booking",
  USER_AUTH: "/api/user/auth",
  ORDER: "/api/orders"
};

// DOM 快取
const DOM = {
  booking: {
    container: document.getElementById("bookingCard"),
    title: document.querySelector(".booking__title"),
    navAuth: document.getElementById("navAuth")
  },
  modal: {
    auth: document.getElementById("authModal")
  }
};

const LOADING = {
  show: () => document.getElementById("loading")?.style.setProperty("display", "flex"),
  hide: () => document.getElementById("loading")?.style.setProperty("display", "none")
};

// BookingPage 類別
class BookingPage {
  constructor(userName) {
    this.token = localStorage.getItem("token");
    this.userName = userName;
    this.bindEvents();
    this.init();
  }

  // 綁定事件
  bindEvents() {
    DOM.booking.navAuth?.addEventListener("click", (e) => this.handleAuthClick(e));
  }

  // 初始化頁面
  async init() {
    if (!this.token) {
      window.location.href = "/";
      return;
    }
    LOADING.show();

    try {
      const bookingData = await this.getBookingData();
      if (!bookingData || !bookingData.attraction) {
        this.renderEmpty(bookingData?.contact?.name || "");
        return;
      }
      this.renderBooking(bookingData);
    } catch (error) {
      console.error("預定資料載入失敗:", error);
      this.renderEmpty();
    } finally {
      document.querySelector(".booking__container")?.classList.add("booking__container--visible");
      document.body.classList.remove("hide");
      LOADING.hide();
    }
  }

  // 獲取預定資料
  async getBookingData() {
    const response = await fetch(API.BOOKING, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });
    if (!response.ok) throw new Error("取得預定資料失敗");
    const { data } = await response.json();
    return data;
  }

  // 渲染預定資料
  renderBooking(data) {
    const {
      attraction: { id: attractionId, name, address, image },
      date,
      time,
      price,
      contact = {}
    } = data;

    const footer = document.querySelector("footer");
    if (footer) {
      footer.style.display = "block";
      footer.classList.remove("footer--fullscreen");
    }

    DOM.booking.container.innerHTML = `
      <section class="booking__section">
        <h3 class="booking__greeting">您好，${contact.name || this.userName || ""}，待預訂的行程如下：</h3>
        <div class="booking__item" id="bookingItemContainer">
          <div class="booking__item-image">
            <img class="booking__image" src="${image}" alt="${name}" loading="lazy">
          </div>
          <div class="booking__item-info">
            <h4 class="booking__item-title">台北一日遊：${name}</h4>
            <ul class="booking__item-details">
              <li class="booking__item-detail"><strong>日期：</strong>${new Date(date).toLocaleDateString()}</li>
              <li class="booking__item-detail"><strong>時間：</strong>${time === "morning" ? "早上9點到下午4點" : "下午2點到晚上9點"}</li>
              <li class="booking__item-detail"><strong>費用：</strong>新台幣 ${price} 元</li>
              <li class="booking__item-detail"><strong>地點：</strong>${address}</li>
            </ul>
          </div>
          <button class="btn btn--danger booking__delete-btn" id="deleteBooking"></button>
        </div>
        <hr />
        <section class="booking__contact">
          <h3 class="booking__subtitle">您的聯絡資料</h3>
          <form id="contactForm" class="booking__form">
            <div class="booking__form-group">
              <label for="contactName" class="booking__label">聯絡姓名：</label>
              <input type="text" id="contactName" class="booking__input" placeholder="請輸入姓名" value="${contact.name || ''}">
            </div>
            <div class="booking__form-group">
              <label for="contactEmail" class="booking__label">連絡信箱：</label>
              <input type="email" id="contactEmail" class="booking__input" placeholder="請輸入電子信箱" value="${contact.email || ''}">
            </div>
            <div class="booking__form-group">
              <label for="contactPhone" class="booking__label">手機號碼：</label>
              <input type="tel" id="contactPhone" class="booking__input" placeholder="0000-000-000">
            </div>
            <p class="booking__note">請保持手機暢通，準時到達，導覽人員將用手機與您聯繫。</p>
          </form>
        </section>
        <hr />
        <section class="booking__payment">
          <h3 class="booking__subtitle">信用卡付款資訊</h3>
          <form id="paymentForm" class="booking__form">
            <div class="booking__form-group">
              <label for="cardNumber" class="booking__label">卡片號碼：</label>
            <div class="tpfield" id="card-number"></div>
            </div>
            <div class="booking__form-group">
              <label for="cardExpiry" class="booking__label">過期時間：</label>
            <div class="tpfield" id="card-expiration-date"></div>
            </div>
            <div class="booking__form-group">
              <label for="cardCVC" class="booking__label">驗證密碼：</label>
            <div class="tpfield" id="card-ccv"></div>
            </div>
          </form>
        </section>
        <hr />
        <p id="totalPrice" class="booking__total">總價：新台幣 ${price} 元</p>
        <button id="confirmPaymentBtn" class="btn btn--primary booking__pay-btn" disabled>確認訂購並付款</button>
      </section>
    `;

    document.getElementById("deleteBooking")?.addEventListener("click", () => this.deleteBooking());

    waitForTPDirectReady(() => {
      setupTPDirect();
      TPDirect.card.onUpdate((update) => {
        const payBtn = document.getElementById("confirmPaymentBtn");
        if (payBtn) {
          if (update.canGetPrime) {
            payBtn.removeAttribute("disabled");
          } else {
            payBtn.setAttribute("disabled", true);
          }
        }
      });
      document.getElementById("confirmPaymentBtn")?.addEventListener("click", async () => {
        const { name, email, phone } = this.getContactInfo();
        if (!name || !email || !phone) {
          window.alert("請填寫完整的聯絡資訊");
          return;
        }
        LOADING.show();
        TPDirect.card.getPrime(async (result) => {
          console.log(result);
          LOADING.hide();
          if (result.status !== 0) {
            alert("付款失敗，請確認卡號資訊");
            return;
          }
          const prime = result.card.prime;
          const contact = { name, email, phone };
          const bookingData = await this.getBookingData();
          const {
            attraction: { id, name: attractionName, address, image },
            date,
            time,
            price
          } = bookingData;
          LOADING.show();
          const res = await fetch(API.ORDER, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.token}`
            },
            body: JSON.stringify({
              prime,
              order: {
                price,
                trip: {
                  attraction: { id, name: attractionName, address, image },
                  date,
                  time
                },
                contact
              }
            })
          });
          const data = await res.json();
          LOADING.hide();
          if (data?.data?.number) {
            await fetch(API.BOOKING, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${this.token}`
              }
            });
            window.location.href = `/thankyou?number=${data.data.number}`;
          } else {
            alert("付款失敗，請稍後再試");
          }
        });
      });
    });
  }

  // 渲染空的預定狀態
  renderEmpty(userName = "") {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.style.display = "block";
      footer.classList.add("footer--fullscreen");
    }

    DOM.booking.container.innerHTML = `
      <h3 class="booking__title">您好，${userName || this.userName}，待預訂的行程如下:</h3>
      <div class="booking__empty"><p>目前沒有任何待預定的行程</p></div>
    `;
  }

  // 刪除預定行程
  async deleteBooking() {
    LOADING.show();
    try {
      const res = await fetch(API.BOOKING, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${this.token}` }
      });
      if (!res.ok) throw new Error("刪除失敗");
      location.reload();
    } catch (error) {
      alert("刪除失敗，請稍後再試");
    } finally {
      LOADING.hide();
    }
  }

  // 處理授權按鈕點擊事件
  handleAuthClick(e) {
    e.preventDefault();
    if (!this.token) {
      DOM.modal.auth.style.display = "block";
      setTimeout(() => DOM.modal.auth.classList.add("show"), 10);
    }
  }

  // 獲取聯絡資訊
  getContactInfo() {
    return {
      name: document.getElementById("contactName").value.trim(),
      email: document.getElementById("contactEmail").value.trim(),
      phone: document.getElementById("contactPhone").value.trim()
    };
  }
}

// 設定與檢查 TPDirect
function setupTPDirect() {
  TPDirect.setupSDK(159798, "app_DJUsVscaYcVN3FxjQFHNaIDf923NOboEE5khx5in81XLnIL0kHmYki1Eg47u", "sandbox");
  TPDirect.card.setup({
    fields: {
      number: { element: "#card-number", placeholder: "**** **** **** ****" },
      expirationDate: { element: "#card-expiration-date", placeholder: "MM / YY" },
      ccv: { element: "#card-ccv", placeholder: "CVV" }
    },
    styles: {
      input: { color: "gray" },
      ".valid": { color: "green" },
      ".invalid": { color: "red" }
    }
  });
}

// 等待 TPDirect 準備就緒
function waitForTPDirectReady(callback) {
  if (
    typeof TPDirect !== "undefined" &&
    typeof TPDirect.card !== "undefined" &&
    typeof TPDirect.card.setup === "function"
  ) {
    callback();
  } else {
    setTimeout(() => waitForTPDirectReady(callback), 50);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "/");

  try {
    const res = await fetch(API.USER_AUTH, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (!result.data) return (window.location.href = "/");

    new BookingPage(result.data.name);
  } catch (err) {
    console.error("初始化失敗", err);
    window.location.href = "/";
  }
});