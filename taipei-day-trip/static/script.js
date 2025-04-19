const apiUrl = "/api/attractions";
const mrtUrl = "/api/mrts";
let page = 0, nextPage = null, isLoading = false;
let lastKeyword = "";

// 共用搜尋處理函數
function handleSearch(keyword) {
  keyword = keyword.trim();
  if (keyword === lastKeyword) return;  // 避免重複請求
  lastKeyword = keyword;
  page = 0;
  nextPage = null;
  fetchAttractions(keyword);
}

// 取得景點資料（支援搜尋）
async function fetchAttractions(keyword = "") {
  if (isLoading) return;
  isLoading = true;

  const url = `${apiUrl}?page=${page}${keyword ? `&keyword=${encodeURIComponent(keyword.trim())}` : ""}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (page === 0) document.getElementById("attractions-container").innerHTML = "";
    if (Array.isArray(data.data) && data.data.length) {
      renderAttractions(data.data);
      page++;
      nextPage = data.nextPage || null;
      observeLastCard();
    }
  } catch (error) {
    console.error("無法載入景點資料", error);
  } finally {
    isLoading = false;
  }
}

// 渲染景點資料
function renderAttractions(attractions) {
  const container = document.getElementById("attractions-container");
  const fragment = document.createDocumentFragment();

  attractions.forEach(({ name, images, id, mrt = "無捷運資訊", category = "未分類" }) => {
    if (!name) return;

    const card = document.createElement("div");
    card.className = "attraction-card";
    card.innerHTML = `
      <a href="/attraction/${id}">
        <img src="${images[0]}" alt="${name}">
        <h3>${name}</h3>
        <div>
          <p class='attraction-mrt'>${mrt}</p>
          <p class='attraction-category'>${category}</p>
        </div>
      </a>`;
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

// IntersectionObserver 自動加載下一頁景點資料
const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && nextPage !== null) {
    fetchAttractions(document.getElementById("searchInput").value);
  }
}, { rootMargin: "100px" });

function observeLastCard() {
  const lastCard = document.querySelector(".attraction-card:last-child");
  if (lastCard) observer.observe(lastCard);
}

// debounce 函數定義
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// 搜尋欄設置
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  const debouncedSearch = debounce(() => handleSearch(searchInput.value), 300);

  document.getElementById("searchBtn").addEventListener("click", () => {
    handleSearch(searchInput.value);
  });

  searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      debouncedSearch();
    }
  });
}

// 取得捷運站資料
async function fetchMRTStations() {
  try {
    const response = await fetch(mrtUrl);
    const data = await response.json();
    if (data.data?.length) renderMRTStations(data.data);
  } catch (error) {
    console.error("無法載入捷運站資料", error);
  }
}

// 渲染捷運站清單
function renderMRTStations(stations) {
  const mrtList = document.getElementById("mrtList");
  mrtList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  stations.forEach(station => {
    const stationElement = document.createElement("div");
    stationElement.className = "mrt-item";
    stationElement.textContent = station;
    stationElement.addEventListener("click", () => {
      if (station === lastKeyword) return;
      handleSearch(station);
    });
    fragment.appendChild(stationElement);
  });

  mrtList.appendChild(fragment);
}

// 捷運滾動設置與箭頭滑動功能
function setupMRTScroll() {
  const mrtList = document.getElementById("mrtList");
  const leftArrow = document.querySelector(".mrt__arrow--left");
  const rightArrow = document.querySelector(".mrt__arrow--right");

  // 滑動捷運列
  const smoothScroll = (offset) => {
    const currentScroll = mrtList.scrollLeft;
    mrtList.scrollTo({
      left: currentScroll + offset,
      behavior: 'smooth'
    });

    // 簡易循環滾動效果
    setTimeout(() => {
      const maxScroll = mrtList.scrollWidth - mrtList.clientWidth;
      if (mrtList.scrollLeft >= maxScroll - 5) {
        mrtList.scrollTo({ left: 1, behavior: 'auto' });
      } else if (mrtList.scrollLeft <= 1) {
        mrtList.scrollTo({ left: maxScroll - 2, behavior: 'auto' });
      }
    }, 300);
  };

  leftArrow.addEventListener("click", () => smoothScroll(-200));
  rightArrow.addEventListener("click", () => smoothScroll(200));

  // 支援滑鼠滾輪水平滾動
  mrtList.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) {
      event.preventDefault();
      smoothScroll(event.deltaY);
    }
  }, { passive: false });
}

// 初始化主程式
async function init() {
  await Promise.all([fetchAttractions(), fetchMRTStations()]);
}

window.addEventListener("DOMContentLoaded", () => {
  const body = document.querySelector("body");
  const overlay = document.getElementById("loadingOverlay");

  // 顯示 overlay 並隱藏內容
  if (overlay) overlay.style.display = "flex";
  body.classList.add("hide");

  // 等待初始化完成後再移除遮罩與顯示內容
  init()
    .catch(err => console.error("初始化失敗", err))
    .finally(() => {
      requestAnimationFrame(() => {
        if (overlay) overlay.style.display = "none";
        body.classList.remove("hide");
      });
    });

  setupSearch();
  setupMRTScroll();
});