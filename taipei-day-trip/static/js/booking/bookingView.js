export const DOM = {
  booking: {
    container: document.getElementById("bookingCard"),
    title: document.querySelector(".booking__title"),
    navAuth: document.getElementById("navAuth")
  },
  modal: {
    auth: document.getElementById("authModal")
  }
};

export const LOADING = {
  show: () => document.getElementById("loading")?.style.setProperty("display", "flex"),
  hide: () => document.getElementById("loading")?.style.setProperty("display", "none")
};

export function renderBooking(data, userName, userEmail) {
  const { attraction, date, time, price, contact = {} } = data;
  const { id, name, address, image } = attraction;

  const footer = document.querySelector("footer");
  if (footer) {
    footer.style.display = "block";
    footer.classList.remove("footer--fullscreen");
  }

  DOM.booking.container.innerHTML = `
    <section class="booking__section">
      <h3 class="booking__greeting">您好，${contact.name || userName || ""}，待預訂的行程如下：</h3>
      <div class="booking__item" id="bookingItemContainer">
        <div class="booking__item-image">
          <img class="booking__image" src="${image}" alt="${name}" loading="lazy">
        </div>
        <div class="booking__item-info">
          <h4 class="booking__item-title">台北一日遊：${name}</h4>
          <ul class="booking__item-details">
            <li><strong>日期：</strong>${new Date(date).toLocaleDateString()}</li>
            <li><strong>時間：</strong>${time === "morning" ? "早上9點到下午4點" : "下午2點到晚上9點"}</li>
            <li><strong>費用：</strong>新台幣 ${price} 元</li>
            <li><strong>地點：</strong>${address}</li>
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
            <input type="text" id="contactName" class="booking__input" placeholder="請輸入姓名" value="${contact.name || userName || ''}">
          </div>
          <div class="booking__form-group">
            <label for="contactEmail" class="booking__label">連絡信箱：</label>
            <input type="email" id="contactEmail" class="booking__input" placeholder="請輸入電子信箱" value="${contact.email || userEmail || ''}">
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
            <label>卡片號碼：</label>
            <div class="tpfield" id="card-number"></div>
          </div>
          <div class="booking__form-group">
            <label>過期時間：</label>
            <div class="tpfield" id="card-expiration-date"></div>
          </div>
          <div class="booking__form-group">
            <label>驗證密碼：</label>
            <div class="tpfield" id="card-ccv"></div>
          </div>
        </form>
      </section>
      <hr />
      <p id="totalPrice" class="booking__total">總價：新台幣 ${price} 元</p>
      <button id="confirmPaymentBtn" class="btn btn--primary booking__pay-btn" disabled>確認訂購並付款</button>
    </section>
  `;
}

export function renderEmpty(userName = "") {
  const footer = document.querySelector("footer");
  if (footer) {
    footer.style.display = "block";
    footer.classList.add("footer--fullscreen");
  }

  DOM.booking.container.innerHTML = `
    <h3 class="booking__title">您好，${userName}，待預訂的行程如下:</h3>
    <div class="booking__empty"><p>目前沒有任何待預定的行程</p></div>
  `;
}

export function setupTPDirect(callback) {
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
  if (callback) callback();
}

export function waitForTPDirectReady(callback) {
  if (typeof TPDirect !== "undefined" && typeof TPDirect.card !== "undefined" && typeof TPDirect.card.setup === "function") {
    callback();
  } else {
    setTimeout(() => waitForTPDirectReady(callback), 50);
  }
}