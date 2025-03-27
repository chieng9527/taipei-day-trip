// 常量定義
const API = {
  BASE_URL: "/api",
  ATTRACTION: "/api/attraction"
};

// DOM 元素快取
const DOM = {
  attraction: {
    title: document.getElementById("attractionTitle"),
    category: document.getElementById("attractionCategory"),
    description: document.getElementById("attractionDescription"),
    address: document.getElementById("attractionAddress"),
    transport: document.getElementById("attractionTransport")
  },
  carousel: {
    container: document.getElementById("carouselImages"),
    dots: document.getElementById("carouselDots"),
    prevBtn: document.querySelector(".carousel__prev"),
    nextBtn: document.querySelector(".carousel__next")
  },
  price: document.getElementById("price")
};

// 輪播圖類別
class Carousel {
  constructor() {
    this.images = [];
    this.currentIndex = 0;
    this.isAnimating = false;
    this.transitionDuration = 300;
    this.loadedImages = new Set();
    this.bindEvents();
  }

  bindEvents() {
    DOM.carousel.prevBtn.addEventListener("click", () => this.prev());
    DOM.carousel.nextBtn.addEventListener("click", () => this.next());
  }

  async init(imageUrls) {
    this.images = imageUrls;
    this.render();
    this.preloadImages();
  }

  async preloadImages() {
    const loadPromises = this.images.map((url, index) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.loadedImages.add(index);
          const imgElement = document.querySelector(`.carousel__image[data-index="${index}"]`);
          if (imgElement) {
            imgElement.classList.remove("loading");
            imgElement.src = url;
          }
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });
    });

    // 等待所有圖片載入完成
    await Promise.all(loadPromises).catch(console.error);
  }

  render() {
    if (this.images.length === 0) return;
    this.renderImages();
    this.renderDots();

    requestAnimationFrame(() => {
      const images = document.querySelectorAll(".carousel__image");
      images.forEach(img => {
        img.style.transition = "transform 0.3s ease-in-out, opacity 0.3s ease-in-out";
      });
      this.updateCarousel();
    });
  }

  renderImages() {
    const fragment = document.createDocumentFragment();

    this.images.forEach((src, index) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = `景點圖片 ${index + 1}`;
      img.className = "carousel__image";
      img.dataset.index = index;
      img.style.transform = `translateX(${index === 0 ? 0 : 100}%)`;
      img.style.opacity = index === 0 ? "1" : "0";

      fragment.appendChild(img);
    });

    DOM.carousel.container.innerHTML = "";
    DOM.carousel.container.appendChild(fragment);
  }

  renderDots() {
    const fragment = document.createDocumentFragment();

    this.images.forEach((_, index) => {
      const dot = document.createElement("span");
      dot.className = "carousel__dot";
      if (index === this.currentIndex) dot.classList.add("active");
      dot.addEventListener("click", () => this.switchTo(index));
      fragment.appendChild(dot);
    });

    DOM.carousel.dots.innerHTML = "";
    DOM.carousel.dots.appendChild(fragment);
  }

  updateCarousel() {
    const images = document.querySelectorAll(".carousel__image");
    const dots = document.querySelectorAll(".carousel__dot");

    images.forEach((img, index) => {
      let offset = this.calculateOffset(index);
      img.style.transform = `translateX(${offset * 100}%)`;
      img.style.opacity = index === this.currentIndex ? "1" : "0";
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === this.currentIndex);
    });
  }

  calculateOffset(index) {
    let offset = index - this.currentIndex;
    if (offset > this.images.length / 2) offset -= this.images.length;
    if (offset < -this.images.length / 2) offset += this.images.length;
    return offset;
  }

  switchTo(index) {
    if (this.isAnimating) return;
    this.startTransition();
    this.currentIndex = index;
    this.updateCarousel();
  }

  prev() {
    if (this.isAnimating) return;
    this.startTransition();
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.updateCarousel();
  }

  next() {
    if (this.isAnimating) return;
    this.startTransition();
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.updateCarousel();
  }

  startTransition() {
    this.isAnimating = true;
    setTimeout(() => {
      this.isAnimating = false;
    }, this.transitionDuration);
  }
}

// 景點頁面類別
class AttractionPage {
  constructor() {
    this.carousel = new Carousel();
    this.bindPriceEvents();
  }

  bindPriceEvents() {
    document.querySelectorAll('input[name="time"]').forEach(input => {
      input.addEventListener("change", (e) => {
        DOM.price.textContent = e.target.value === "morning"
          ? "新台幣 2000 元"
          : "新台幣 2500 元";
      });
    });
  }

  async fetchAttractionData() {
    try {
      const attractionId = window.location.pathname.split("/").pop();
      const response = await fetch(`${API.ATTRACTION}/${attractionId}`);
      const { data } = await response.json();

      if (!data) throw new Error("景點資料載入失敗");

      return data;
    } catch (error) {
      console.error(error);
      DOM.attraction.title.textContent = "景點載入失敗";
      throw error;
    }
  }

  async init() {
    try {
      const data = await this.fetchAttractionData();
      this.renderAttractionDetails(data);
      await this.carousel.init(data.images);
    } catch (error) { document.getElementById("attractionTitle").textContent = "載入失敗，請稍後再試"; }
  }

  renderAttractionDetails(data) {
    const { name, category, mrt, description, address, transport } = data;

    DOM.attraction.title.textContent = name;
    DOM.attraction.category.textContent = `${category} at ${mrt || "無捷運資訊"}`;
    DOM.attraction.description.textContent = description;
    DOM.attraction.address.textContent = address;
    DOM.attraction.transport.textContent = transport;
  }
}

// 初始化頁面
const attractionPage = new AttractionPage();
attractionPage.init();