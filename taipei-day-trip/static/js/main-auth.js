import { setupAuth } from "./auth/authController.js";

document.addEventListener("DOMContentLoaded", () => {
  setupAuth(
    document.getElementById("authModal"),
    document.getElementById("loginForm"),
    document.getElementById("registerForm"),
    document.getElementById("navAuth"),
    document.getElementById("navBooking"),
    document.querySelector(".nav__item:last-child a")
  );
});