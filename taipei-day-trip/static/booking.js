// 常量定義
const API = {
  BOOKING: "/api/booking",
  USER_AUTH: "/api/user/auth"
};

// DOM 元素快取
const DOM = {
  booking: {
    container: document.getElementById("bookingCard"),
    empty: document.getElementById("bookingEmpty"),
    title: document.querySelector(".booking__title"),
    navAuth: document.getElementById("navAuth")
  },
  modal: {
    auth: document.getElementById("authModal")
  }
};

// 預定頁面類別
class BookingPage {
  constructor(userName) {
    this.token = localStorage.getItem("token");
    this.userName = userName;
    this.bindEvents();
    this.init();
  }

  bindEvents() {
    // 導航欄點擊事件
    DOM.booking.navAuth?.addEventListener("click", (e) => this.handleAuthClick(e));
  }

  async init() {
    // 檢查登入狀態
    if (!this.token) {
      window.location.href = "/";
      return;
    }

    try {
      const bookingData = await this.fetchBookingData();
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
    }
  }

  async fetchBookingData() {
    const response = await fetch(API.BOOKING, {
      headers: {
        "Authorization": `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error("取得預定資料失敗");
    }

    const { data } = await response.json();
    return data;
  }

  renderBooking(data) {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.style.display = "block";
      footer.classList.remove("footer--fullscreen");
    }

    const {
      attraction: { id: attractionId, name, address, image },
      date,
      time,
      price,
      contact = { name: "", email: "" }
    } = data;

    // 渲染預定內容
    DOM.booking.container.innerHTML = `
      <section class="booking__section">
        <h3 class="booking__greeting">您好，${contact.name}，待預訂的行程如下：</h3>
        <div class="booking__item" id="bookingItemContainer">
          <div class="booking__item-image">
            <img class="booking__image" src="${image}" alt="${name}" loading="lazy">
          </div>
          <div class="booking__item-info">
            <h4 class="booking__item-title">台北一日遊：${name}</h4>
            <ul class="booking__item-details">
              <li class="booking__item-detail"><strong>日期：</strong> ${new Date(date).toLocaleDateString()}</li>
              <li class="booking__item-detail"><strong>時間：</strong> ${time === "morning" ? "早上9點到下午4點" : "下午2點到晚上9點"}</li>
              <li class="booking__item-detail"><strong>費用：</strong> 新台幣 ${price} 元</li>
              <li class="booking__item-detail"><strong>地點：</strong> ${address}</li>
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
            <p class="booking__note">請保持手機暢通，準時到達，導覽人員將用手機與您聯繫，務必留下正確的聯絡方式。</p>
          </form>
        </section>
        <hr />
        <section class="booking__payment">
          <h3 class="booking__subtitle">信用卡付款資訊</h3>
          <form id="paymentForm" class="booking__form">
            <div class="booking__form-group">
              <label for="cardNumber" class="booking__label">卡片號碼：</label>
              <input type="text" id="cardNumber" class="booking__input" placeholder="**** **** **** ****">
            </div>
            <div class="booking__form-group">
              <label for="cardExpiry" class="booking__label">過期時間：</label>
              <input type="text" id="cardExpiry" class="booking__input" placeholder="MM /YY">
            </div>
            <div class="booking__form-group">
              <label for="cardCVC" class="booking__label">驗證密碼：</label>
              <input type="password" id="cardCVC" class="booking__input" placeholder="CVV ">
            </div>
          </form>
        </section>
        <hr />
        <p id="totalPrice" class="booking__total">總價：新台幣 ${price} 元</p>
        <button id="confirmPaymentBtn" class="btn btn--primary booking__pay-btn">確認訂購並付款</button>
      </section>
    `;

    // 綁定刪除事件
    document.getElementById("deleteBooking")?.addEventListener("click", () => this.deleteBooking());

    // 綁定付款事件（SDK）
    const paymentBtn = document.getElementById("confirmPaymentBtn");
    paymentBtn?.addEventListener("click", () => {
      alert("未完成敬請期待！");
    });

    // 渲染總價
    const totalPriceEl = document.getElementById("totalPrice");
    if (totalPriceEl) totalPriceEl.textContent = `總價：新台幣 ${price} 元`;
  }

  renderEmpty() {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.style.display = "block";
      footer.classList.add("footer--fullscreen");
    }

    DOM.booking.container.innerHTML = `
      <h3 class="booking__title">您好，${this.userName || ""}，待預訂的行程如下:</h3>
      <div class="booking__empty">
        <p>目前沒有任何待預定的行程</p>
      </div>
    `;
  }

  async deleteBooking() {
    if (!confirm("確定要刪除此行程嗎？")) return;

    try {
      const response = await fetch(API.BOOKING, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error("刪除失敗");
      }

      location.reload();
    } catch (error) {
      console.error("刪除失敗:", error);
      alert("刪除行程失敗，請稍後再試");
    }
  }

  handleAuthClick(e) {
    e.preventDefault();
    if (!this.token) {
      DOM.modal.auth.style.display = "block";
      setTimeout(() => {
        DOM.modal.auth.classList.add("show");
      }, 10);
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    const res = await fetch("/api/user/auth", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await res.json();
    const userData = result.data;

    if (!userData) {
      window.location.href = "/";
      return;
    }

    new BookingPage(userData.name);
  } catch (error) {
    console.error("初始化失敗:", error);
    window.location.href = "/";
  }
});