import { BookingPage } from "./booking/bookingController.js";

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.startsWith("/booking")) {
    new BookingPage();
  }
});