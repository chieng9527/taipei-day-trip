export const DOM = {
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
  price: document.getElementById("price"),
  bookingForm: document.getElementById("bookingForm"),
  authModal: document.getElementById("authModal"),
  navBooking: document.getElementById("navBooking")
};

export class Carousel {
  constructor() {
    this.images = [];
    this.currentIndex = 0;
    this.isAnimating = false;
    this.transitionDuration = 300;
    this.observer = new IntersectionObserver(this.onImageVisible.bind(this), {
      root: DOM.carousel.container,
      threshold: 0.1
    });
    this.bindEvents();
  }

  bindEvents() {
    DOM.carousel.prevBtn.addEventListener("click", () => this.prev());
    DOM.carousel.nextBtn.addEventListener("click", () => this.next());
  }

  async init(imageUrls) {
    this.images = imageUrls;
    this.render();
    this.lazyLoadImages();
  }

  lazyLoadImages() {
    const images = document.querySelectorAll(".carousel__image");
    images.forEach(img => this.observer.observe(img));
  }

  onImageVisible(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (!img.src) {
          img.src = img.dataset.src;
          img.onload = () => img.classList.remove("loading");
        }
        this.observer.unobserve(img);
      }
    });
  }

  render() {
    if (this.images.length === 0) return;
    this.renderImages();
    this.renderDots();
    requestAnimationFrame(() => {
      document.querySelectorAll(".carousel__image").forEach(img => {
        img.style.transition = "transform 0.3s ease-in-out, opacity 0.3s ease-in-out";
      });
      this.updateCarousel();
    });
  }

  renderImages() {
    const fragment = document.createDocumentFragment();
    this.images.forEach((src, index) => {
      const img = document.createElement("img");
      if (index === 0) {
        img.src = src; // 第一張圖片立即載入
      } else {
        img.dataset.src = src;
        img.setAttribute("loading", "lazy");
      }
      img.alt = `景點圖片 ${index + 1}`;
      img.className = "carousel__image loading";
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
    document.querySelectorAll(".carousel__image").forEach((img, index) => {
      const offset = this.calculateOffset(index);
      img.style.transform = `translateX(${offset * 100}%)`;
      img.style.opacity = index === this.currentIndex ? "1" : "0";
    });

    document.querySelectorAll(".carousel__dot").forEach((dot, index) => {
      dot.classList.toggle("active", index === this.currentIndex);
    });

    // 預先載入下一張圖片
    const nextIndex = (this.currentIndex + 1) % this.images.length;
    const nextImage = document.querySelector(`.carousel__image[data-index="${nextIndex}"]`);
    if (nextImage && !nextImage.src) {
      nextImage.src = nextImage.dataset.src;
    }
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

export function showAuthModal() {
  DOM.authModal.style.display = "block";
  setTimeout(() => {
    DOM.authModal.classList.add("show");
  }, 10);
}