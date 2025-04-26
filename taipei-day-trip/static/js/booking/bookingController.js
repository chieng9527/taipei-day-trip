import { fetchBooking, deleteBooking, fetchUser, sendOrder } from "../booking/bookingModel.js";
import { DOM, LOADING, renderBooking, renderEmpty, setupTPDirect, waitForTPDirectReady } from "../booking/bookingView.js";

let isBookingInitializing = false;

export class BookingPage {
  constructor() {
    this.init();
  }

  async init() {
    if (isBookingInitializing) return;
    isBookingInitializing = true;

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const authRes = await fetchUser(token);
      if (authRes?.error || !authRes?.data) {
        localStorage.removeItem("token");
        window.location.href = "/";
        return;
      }

      const userName = authRes.data.name;
      const userEmail = authRes.data.email;

      LOADING.show();

      let bookingData;
      try {
        bookingData = await fetchBooking(token);
      } catch (err) {
        console.error("取得預定資料失敗:", err);
        renderEmpty(userName);
        LOADING.hide();
        return;
      }

      if (!bookingData || !bookingData.attraction) {
        renderEmpty(userName);
        LOADING.hide();
        return;
      }

      renderBooking(bookingData, userName, userEmail);

      this.bindDeleteBooking(token, userName);
      this.bindPayment(bookingData, token, userName);

    } catch (err) {
      console.error("初始化 booking 頁面失敗:", err);
      alert("系統錯誤，請重新登入");
      localStorage.removeItem("token");
      window.location.href = "/";
    } finally {
      const container = document.querySelector(".booking__container");
      if (container) container.classList.add("booking__container--visible");

      isBookingInitializing = false;
      LOADING.hide();
    }
  }

  bindDeleteBooking(token, userName) {
    const deleteBtn = document.getElementById("deleteBooking");
    if (!deleteBtn) return;
    deleteBtn.addEventListener("click", async () => {
      LOADING.show();
      try {
        await deleteBooking(token);
        renderEmpty(userName);
      } catch (err) {
        alert("刪除失敗，請稍後再試");
      } finally {
        LOADING.hide();
      }
    });
  }

  bindPayment(bookingData, token, userName) {
    waitForTPDirectReady(() => {
      setupTPDirect(() => {
        TPDirect.card.onUpdate((update) => {
          const btn = document.getElementById("confirmPaymentBtn");
          if (btn) {
            btn.disabled = !update.canGetPrime;
          }
        });

        document.getElementById("confirmPaymentBtn")?.addEventListener("click", async () => {
          const contactName = document.getElementById("contactName").value;
          const contactEmail = document.getElementById("contactEmail").value;
          const contactPhone = document.getElementById("contactPhone").value;

          if (!contactName || !contactEmail || !contactPhone) {
            return alert("請填寫完整聯絡資訊");
          }

          LOADING.show();

          TPDirect.card.getPrime(async (result) => {
            if (result.status !== 0) {
              LOADING.hide();
              return alert("付款失敗，請確認卡片資訊");
            }

            const prime = result.card.prime;
            const order = {
              price: bookingData.price,
              trip: {
                attraction: bookingData.attraction,
                date: bookingData.date,
                time: bookingData.time
              },
              contact: { name: contactName, email: contactEmail, phone: contactPhone }
            };

            const res = await sendOrder(token, prime, order);
            if (res?.data?.number) {
              await deleteBooking(token);
              window.location.href = `/thankyou?number=${res.data.number}`;
            } else {
              alert("付款失敗，請稍後再試");
            }
            LOADING.hide();
          });
        });
      });
    });
  }
}