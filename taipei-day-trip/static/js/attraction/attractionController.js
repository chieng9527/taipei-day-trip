import { fetchAttractionData, fetchBookingStatus, createBooking, fetchUserAuth } from "../attraction/attractionModel.js";
import { DOM, Carousel, showAuthModal } from "../attraction/attractionView.js";

let cachedLoginStatus = null;
async function checkUserLoggedIn(force = false) {
  if (!force && cachedLoginStatus !== null) return cachedLoginStatus;
  const token = localStorage.getItem("token");
  if (!token) return (cachedLoginStatus = false);
  const res = await fetchUserAuth(token);
  return (cachedLoginStatus = res);
}

export class AttractionPage {
  constructor() {
    this.carousel = new Carousel();
  }

  async init() {
    try {
      const attractionId = window.location.pathname.split("/").pop();
      const data = await fetchAttractionData(attractionId);
      this.renderAttraction(data);
      this.carousel.init(data.images);
      this.bindBookingForm();
      this.bindNavBooking();
    } catch (error) {
      console.error(error);
      DOM.attraction.title.textContent = "載入失敗，請稍後再試";
    }
  }

  renderAttraction(data) {
    const { name, category, mrt, description, address, transport } = data;
    DOM.attraction.title.textContent = name;
    DOM.attraction.category.textContent = `${category} at ${mrt || "無捷運資訊"}`;
    DOM.attraction.description.textContent = description;
    DOM.attraction.address.textContent = address;
    DOM.attraction.transport.textContent = transport;
  }

  bindBookingForm() {
    DOM.bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token || !(await fetchUserAuth(token))) {
        showAuthModal();
        return;
      }

      const date = document.getElementById("date").value;
      const time = document.querySelector("input[name='time']:checked")?.value;
      const price = time === "morning" ? 2000 : 2500;
      const attractionId = window.location.pathname.split("/").pop();

      if (!date || new Date(date) < new Date().setHours(0, 0, 0, 0)) {
        return alert("請選擇有效的日期");
      }

      const res = await createBooking(token, { attractionId: parseInt(attractionId), date, time, price });
      if (res.ok) {
        window.location.href = "/booking";
      } else {
        alert(res.message || "預約失敗");
      }
    });
  }

  bindNavBooking() {
    DOM.navBooking.addEventListener("click", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token || !(await fetchUserAuth(token))) {
        showAuthModal();
      } else {
        window.location.href = "/booking";
      }
    });
  }
}