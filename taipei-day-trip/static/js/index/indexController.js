import { fetchAttractionsAPI, fetchMRTStationsAPI } from "../index/indexModel.js";
import { renderAttractions, renderMRTStations } from "../index/indexView.js";

let page = 0, nextPage = null, isLoading = false;
let lastKeyword = "";

export async function initHomePage() {
  await Promise.all([fetchAttractions(), fetchMRTStations()]);
}

async function fetchAttractions(keyword = "") {
  if (isLoading) return;
  isLoading = true;

  try {
    const data = await fetchAttractionsAPI(page, keyword);
    if (page === 0) document.getElementById("attractions-container").innerHTML = "";

    if (Array.isArray(data.data) && data.data.length) {
      renderAttractions(data.data);
      page++;
      nextPage = data.nextPage || null;
      observeLastCard(keyword);
    }
  } catch (error) {
    console.error("無法載入景點資料", error);
  } finally {
    isLoading = false;
  }
}

async function fetchMRTStations() {
  try {
    const data = await fetchMRTStationsAPI();
    if (data.data?.length) {
      renderMRTStations(data.data, handleSearch);
    }
  } catch (error) {
    console.error("無法載入捷運站資料", error);
  }
}

function observeLastCard(keyword) {
  const lastCard = document.querySelector(".attraction-card:last-child");
  if (!lastCard) return;

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && nextPage !== null) {
      fetchAttractions(keyword);
    }
  }, { rootMargin: "100px" });

  observer.observe(lastCard);
}

export function handleSearch(keyword) {
  keyword = keyword.trim();
  if (keyword === lastKeyword) return;
  lastKeyword = keyword;
  page = 0;
  nextPage = null;
  fetchAttractions(keyword);
}

export function setupSearchEvents() {
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");

  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const debouncedSearch = debounce(() => handleSearch(input.value), 300);
  btn.addEventListener("click", () => handleSearch(input.value));
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      debouncedSearch();
    }
  });
}

export function setupMRTScroll() {
  const mrtList = document.getElementById("mrtList");
  const leftArrow = document.querySelector(".mrt__arrow--left");
  const rightArrow = document.querySelector(".mrt__arrow--right");

  const smoothScroll = (offset) => {
    const current = mrtList.scrollLeft;
    mrtList.scrollTo({ left: current + offset, behavior: 'smooth' });

    setTimeout(() => {
      const max = mrtList.scrollWidth - mrtList.clientWidth;
      if (mrtList.scrollLeft >= max - 5) mrtList.scrollTo({ left: 1, behavior: 'auto' });
      if (mrtList.scrollLeft <= 1) mrtList.scrollTo({ left: max - 2, behavior: 'auto' });
    }, 300);
  };

  leftArrow.addEventListener("click", () => smoothScroll(-200));
  rightArrow.addEventListener("click", () => smoothScroll(200));

  mrtList.addEventListener("wheel", e => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      e.preventDefault();
      smoothScroll(e.deltaY);
    }
  }, { passive: false });
}