const apiUrl = "/api/attractions";
const mrtUrl = "/api/mrts";
let page = 0, nextPage = null, isLoading = false;

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

// 設置 IntersectionObserver，自動載入更多資料
const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && nextPage !== null) {
    fetchAttractions(document.getElementById("searchInput").value);
  }
}, { rootMargin: "100px" });

function observeLastCard() {
  const lastCard = document.querySelector(".attraction-card:last-child");
  if (lastCard) observer.observe(lastCard);
}

// 設置搜尋功能
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  document.getElementById("searchBtn").addEventListener("click", () => resetSearch(searchInput.value));
  searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") resetSearch(searchInput.value);
  });
}

function resetSearch(keyword) {
  page = 0;
  nextPage = null;
  fetchAttractions(keyword);
}

// 取得捷運站列表並渲染
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
    stationElement.addEventListener("click", () => resetSearch(station));
    fragment.appendChild(stationElement);
  });

  mrtList.appendChild(fragment);
}

// 設置捷運站滾動功能
function setupMRTScroll() {
  const mrtList = document.getElementById("mrtList");
  const leftArrow = document.querySelector(".mrt__arrow--left");
  const rightArrow = document.querySelector(".mrt__arrow--right");

  // 使用箭頭按鈕滾動
  leftArrow.addEventListener("click", () => smoothScroll(-200));
  rightArrow.addEventListener("click", () => smoothScroll(200));

  // 使用新的滾輪處理方式
  mrtList.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) {
      event.preventDefault();
      smoothScroll(event.deltaY);
    }
  }, { passive: false });

  // 平滑滾動函數
  function smoothScroll(offset) {
    const currentScroll = mrtList.scrollLeft;
    mrtList.scrollTo({
      left: currentScroll + offset,
      behavior: 'smooth'
    });

    // 處理循環滾動
    setTimeout(() => {
      const maxScroll = mrtList.scrollWidth - mrtList.clientWidth;
      if (mrtList.scrollLeft >= maxScroll - 5) {
        mrtList.scrollTo({ left: 1, behavior: 'auto' });
      } else if (mrtList.scrollLeft <= 1) {
        mrtList.scrollTo({ left: maxScroll - 2, behavior: 'auto' });
      }
    }, 300);
  }
}

// 初始化
async function init() {
  await Promise.all([fetchAttractions(), fetchMRTStations()]);
}

setupSearch();
setupMRTScroll();
init();

