import { initHomePage, setupSearchEvents, setupMRTScroll } from "./index/indexController.js";

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("loadingOverlay");

  initHomePage()
    .catch(err => console.error("初始化失敗", err))
    .finally(() => {
      requestAnimationFrame(() => {
        if (overlay) overlay.style.display = "none";
      });
    });

  setupSearchEvents();
  setupMRTScroll();
});