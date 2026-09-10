/* ==================================================
   AVYORA - MAIN JAVASCRIPT
   File: src/main.js
   ================================================== */

import "./style.css";

const PRODUCT_API_URL = "https://dummyjson.com/products?limit=0";
const USD_TO_INR = 83.5;
const FALLBACK_PRODUCTS = [
   { id: 1, title: "The Everyday Carry Bag", price: 89, category: "women's clothing", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=85", rating: { rate: 4.8, count: 124 } },
   { id: 2, title: "Studio Wireless Headphones", price: 100, category: "electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85", rating: { rate: 4.9, count: 98 } },
   { id: 3, title: "Minimalist Gold Watch", price: 74, category: "jewelery", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=85", rating: { rate: 4.7, count: 86 } },
   { id: 4, title: "Relaxed Premium Tee", price: 36, category: "men's clothing", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85", rating: { rate: 4.6, count: 71 } },
   { id: 5, title: "Cloud Knit Sweater", price: 58, category: "women's clothing", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85", rating: { rate: 4.8, count: 112 } },
   { id: 6, title: "Smart Home Speaker", price: 69, category: "electronics", image: "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=800&q=85", rating: { rate: 4.5, count: 64 } },
   { id: 7, title: "Pearl Accent Earrings", price: 42, category: "jewelery", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85", rating: { rate: 4.7, count: 55 } },
   { id: 8, title: "Classic Oxford Shirt", price: 49, category: "men's clothing", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=85", rating: { rate: 4.6, count: 48 } }
];

let products = [];
let activeCategory = "all";
let searchTerm = "";
let sortOrder = "featured";
let cartItems = JSON.parse(localStorage.getItem("avyora-cart") || "[]");
let wishlistItems = JSON.parse(localStorage.getItem("avyora-wishlist") || "[]");
let featuredIndex = 0;
let featuredProducts = [];
let featuredTimer;

document.addEventListener("DOMContentLoaded", function () {
   bindProductControls();
   updateCartCount();
   updateWishlistCount();
   bindWishlistDrawer();
   bindCartDrawer();
   bindFeaturedCarousel();
   renderWishlistDrawer();
   loadProducts();
});

async function loadProducts() {
   try {
      const response = await fetch(PRODUCT_API_URL);
      if (!response.ok) throw new Error(`Product API returned ${response.status}`);
      const data = await response.json();
      products = normalizeProducts(data.products);
   } catch (error) {
      console.warn("Using fallback products because the product API is unavailable.", error);
      products = normalizeProducts(FALLBACK_PRODUCTS);
   }

   updateHeroMoods();
   renderProducts();
   setFeaturedProducts(products);
   renderBundle(products.slice(0, 3));
   renderWishlistDrawer();
   startFeaturedCarousel();
}

function normalizeProducts(items) {
   return items.map(function (item) {
      const rawCategory = item.category || "lifestyle";
      const category = getCatalogCategory(rawCategory);

      return {
         ...item,
         category,
         displayCategory: item.category || category,
         brand: item.brand || "Avyora Select",
         image: item.thumbnail || item.image || item.images?.[0],
         images: item.images || [item.image],
         description: item.description || "A considered everyday favorite with practical function and details designed to last.",
         tags: item.tags || [],
         stock: item.stock || 0,
         discountPercentage: item.discountPercentage || 0,
         rating: typeof item.rating === "number"
            ? { rate: item.rating, count: item.reviews?.length || 0 }
            : item.rating || { rate: 0, count: 0 }
      };
   });
}

function getCatalogCategory(category) {
   const normalizedCategory = category.toLowerCase();

   if (["smartphones", "laptops", "tablets"].includes(normalizedCategory)) {
      return "electronics";
   }

   if (normalizedCategory === "electronics") {
      return "electronics";
   }

   if (["men's clothing", "menswear"].includes(normalizedCategory)) {
      return "menswear";
   }

   if (["women's clothing", "womenswear"].includes(normalizedCategory)) {
      return "womenswear";
   }

   if (["jewelery", "jewelry", "accessories", "mobile-accessories"].includes(normalizedCategory)) {
      return "accessories";
   }

   if (["beauty", "fragrances", "skin-care"].includes(normalizedCategory)) {
      return "beauty";
   }

   if (["home-decoration", "furniture", "lighting", "kitchen-accessories"].includes(normalizedCategory)) {
      return "home";
   }

   if (normalizedCategory === "groceries") {
      return "groceries";
   }

   if (["sports-accessories", "sports"].includes(normalizedCategory)) {
      return "sports";
   }

   if (["automotive", "motorcycle", "vehicle"].includes(normalizedCategory)) {
      return "automotive";
   }

   if (normalizedCategory.startsWith("men-") || normalizedCategory.startsWith("mens-")) {
      return "menswear";
   }

   if ((normalizedCategory.startsWith("women-") || normalizedCategory.startsWith("womens-")) && !normalizedCategory.includes("jewellery")) {
      return "womenswear";
   }

   if (["womens-jewellery", "mens-watches", "womens-watches", "womens-bags", "sunglasses", "shoes"].includes(normalizedCategory)) {
      return "accessories";
   }

   return "accessories";
}

function bindProductControls() {
   const heroMoods = {
      "power-up": {
         title: "Better days, switched on.",
         description: "Smart upgrades and useful essentials to make your everyday a little more capable."
      },
      "dress-up": {
         title: "Make an entrance.",
         description: "Easy pieces and considered details for the days you want to feel a little more put together."
      },
      "settle-in": {
         title: "Make room for good living.",
         description: "Comfort-first finds and quiet upgrades for a home that feels like yours."
      }
   };

   document.querySelectorAll(".hero-mood-option").forEach(function (moodButton) {
      moodButton.addEventListener("click", function () {
         const mood = heroMoods[moodButton.dataset.mood];
         if (!mood) return;

         document.querySelectorAll(".hero-mood-option").forEach(function (item) {
            const isActive = item === moodButton;
            item.classList.toggle("active", isActive);
            item.setAttribute("aria-pressed", String(isActive));
         });

         document.getElementById("heroTitleAccent").textContent = mood.title;
         document.getElementById("heroDescription").textContent = mood.description;

         const matchingTab = document.querySelector(`.product-tab[data-filter="${moodButton.dataset.filter}"]`);
         matchingTab?.click();
      });
   });

   document.querySelectorAll(".product-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
         activeCategory = tab.dataset.filter;
         document.querySelectorAll(".product-tab").forEach(function (item) {
            const isActive = item === tab;
            item.classList.toggle("active", isActive);
            item.setAttribute("aria-selected", isActive ? "true" : "false");
         });
         setFeaturedProducts(activeCategory === "all"
            ? products
            : products.filter(product => product.category === activeCategory));
         renderProducts();
      });
   });

   document.getElementById("productSearch")?.addEventListener("input", function (event) {
      searchTerm = event.target.value.trim().toLowerCase();
      renderProducts();
   });

   document.getElementById("productSort")?.addEventListener("change", function (event) {
      sortOrder = event.target.value;
      renderProducts();
   });

   document.querySelectorAll(".product-view-toggle").forEach(function (button) {
      button.addEventListener("click", function () {
         document.querySelectorAll(".product-view-toggle").forEach(item => item.classList.toggle("active", item === button));
         document.getElementById("productGrid")?.classList.toggle("product-list-view", button.dataset.view === "list");
      });
   });

   document.querySelectorAll(".product-swatch").forEach(function (swatch) {
      swatch.addEventListener("click", function () {
         document.querySelectorAll(".product-swatch").forEach(item => item.classList.toggle("active", item === swatch));
      });
   });

   document.querySelectorAll(".product-secondary-action").forEach(function (button) {
      button.addEventListener("click", function () {
         const product = products[0];
         if (product) openQuickView(product);
      });
   });
}

function updateHeroMoods() {
   const availableCategories = new Set(products.map(product => product.category));
   const availableMoodButtons = document.querySelectorAll(".hero-mood-option");

   availableMoodButtons.forEach(function (button) {
      button.hidden = !availableCategories.has(button.dataset.filter);
   });

   const moodPicker = document.querySelector(".hero-mood-picker");
   if (moodPicker) moodPicker.hidden = [...availableMoodButtons].every(button => button.hidden);
}

function setFeaturedProducts(categoryProducts) {
   featuredProducts = categoryProducts.length ? categoryProducts : products;
   featuredIndex = 0;
   updateFeaturedProduct(featuredProducts[featuredIndex]);
   renderFeaturedDots();
}

function renderProducts() {
   const grid = document.getElementById("productGrid");
   if (!grid) return;

   let visibleProducts = products.filter(function (product) {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      const searchableText = `${product.title} ${product.brand} ${product.category} ${product.description} ${product.tags.join(" ")}`.toLowerCase();
      const matchesSearch = searchableText.includes(searchTerm);
      return matchesCategory && matchesSearch;
   });

   if (sortOrder === "price-low") visibleProducts.sort((a, b) => a.price - b.price);
   if (sortOrder === "price-high") visibleProducts.sort((a, b) => b.price - a.price);
   if (sortOrder === "rating") visibleProducts.sort((a, b) => b.rating.rate - a.rating.rate);

   grid.innerHTML = visibleProducts.map(createProductCard).join("");
   document.getElementById("productCount").textContent = `${visibleProducts.length} curated products`;
   document.getElementById("productEmptyState").hidden = visibleProducts.length !== 0;
   bindCardActions();
}

function createProductCard(product, index) {
   const status = product.discountPercentage > 0 ? `<span class="product-status product-status-sale">-${Math.round(product.discountPercentage)}%</span>` : index < 3 ? `<span class="product-status">New</span>` : "";
   const isWishlisted = wishlistItems.includes(product.id);
   const wishlistIcon = isWishlisted ? "bi bi-heart-fill" : "bi bi-heart";
   return `<div class="col-6 col-md-4 col-xl-3 product-item" data-category="${product.category}" data-product-id="${product.id}">
      <article class="product-card product-shop-card">
         <div class="product-image-wrap">${status}<button class="product-wishlist${isWishlisted ? " selected" : ""}" type="button" aria-label="Save ${escapeHtml(product.title)}" aria-pressed="${isWishlisted}"><i class="${wishlistIcon}"></i></button><img src="${product.image}" alt="${escapeHtml(product.title)}" class="product-image"></div>
         <div class="product-details"><span class="product-category">${escapeHtml(product.brand)} · ${escapeHtml(product.displayCategory)}</span><h3 class="product-name" title="${escapeHtml(product.title)}">${escapeHtml(product.title)}</h3><div class="product-meta"><span class="product-rating"><i class="bi bi-star-fill"></i> ${product.rating.rate} <small>(${product.rating.count})</small></span><span><del class="product-old-price">${formatPrice(product.price / (1 - product.discountPercentage / 100))}</del> <strong class="product-price">${formatPrice(product.price)}</strong></span></div><div class="product-stock"><i class="bi bi-box-seam"></i> ${product.stock} in stock</div><div class="product-card-actions"><button class="product-cart-button" type="button"><i class="bi bi-cart-plus"></i> Add to cart</button><button class="product-buy-button" type="button">Buy now</button></div><button class="product-quick-link" type="button">Quick view <i class="bi bi-arrow-up-right"></i></button></div>
      </article>
   </div>`;
}

function bindCardActions() {
   document.querySelectorAll(".product-wishlist").forEach(function (button) {
      button.addEventListener("click", function () {
         const isSelected = button.getAttribute("aria-pressed") === "true";
         const productId = Number(button.closest(".product-item").dataset.productId);

         button.setAttribute("aria-pressed", String(!isSelected));
         button.classList.toggle("selected", !isSelected);
         button.querySelector("i").className = isSelected ? "bi bi-heart" : "bi bi-heart-fill";

         if (isSelected) {
            wishlistItems = wishlistItems.filter(id => id !== productId);
         } else if (!wishlistItems.includes(productId)) {
            wishlistItems.push(productId);
         }

         localStorage.setItem("avyora-wishlist", JSON.stringify(wishlistItems));
         updateWishlistCount();
         renderWishlistDrawer();
      });
   });

   document.querySelectorAll(".product-quick-link").forEach(function (button) {
      button.addEventListener("click", function () {
         const card = button.closest(".product-item");
         const product = products.find(item => String(item.id) === card.dataset.productId);
         if (product) openQuickView(product);
      });
   });

   document.querySelectorAll(".product-cart-button, .product-buy-button").forEach(function (button) {
      button.addEventListener("click", function () {
         const card = button.closest(".product-item");
         const product = products.find(item => String(item.id) === card.dataset.productId);

         if (product) {
            addToCart(product, button.classList.contains("product-buy-button"));
         }
      });
   });
}

function updateFeaturedProduct(product) {
   if (!product) return;
   document.getElementById("featuredProductImage").src = product.image;
   document.getElementById("featuredProductImage").alt = product.title;
   document.getElementById("featuredProductTitle").textContent = product.title;
   document.getElementById("featuredProductDescription").textContent = `${product.description} Ships in 2-3 business days with ${product.stock} units currently available.`;
   document.getElementById("featuredProductRating").textContent = product.rating.rate;
   document.getElementById("featuredProductPrice").textContent = formatPrice(product.price);
   document.getElementById("featuredProductOldPrice").textContent = formatPrice(product.price * 1.2);
   document.querySelector(".product-feature-panel .product-add-button").onclick = function () {
      addToCart(product, false);
   };
}

function bindFeaturedCarousel() {
   document.querySelector("[data-featured-prev]")?.addEventListener("click", function () {
      changeFeaturedProduct(-1);
   });

   document.querySelector("[data-featured-next]")?.addEventListener("click", function () {
      changeFeaturedProduct(1);
   });
}

function changeFeaturedProduct(direction) {
   if (!featuredProducts.length) return;

   featuredIndex = (featuredIndex + direction + featuredProducts.length) % featuredProducts.length;
   updateFeaturedProduct(featuredProducts[featuredIndex]);
   renderFeaturedDots();
   startFeaturedCarousel();
}

function startFeaturedCarousel() {
   window.clearInterval(featuredTimer);
   featuredTimer = window.setInterval(function () {
      changeFeaturedProduct(1);
   }, 5500);
}

function renderFeaturedDots() {
   const dots = document.getElementById("featuredSlideDots");

   if (!dots || !featuredProducts.length) return;

   const visibleDots = Math.min(featuredProducts.length, 6);
   dots.innerHTML = Array.from({ length: visibleDots }, function (_, index) {
      return `<button class="featured-slide-dot${index === featuredIndex % visibleDots ? " active" : ""}" type="button" data-featured-index="${index}" aria-label="Show featured product ${index + 1}"></button>`;
   }).join("");

   dots.querySelectorAll("[data-featured-index]").forEach(function (dot) {
      dot.addEventListener("click", function () {
         featuredIndex = Number(dot.dataset.featuredIndex);
         updateFeaturedProduct(featuredProducts[featuredIndex]);
         renderFeaturedDots();
         startFeaturedCarousel();
      });
   });
}

function renderBundle(bundle) {
   const container = document.getElementById("bundleProducts");
   if (!container || !bundle.length) return;
   container.innerHTML = bundle.map(product => `<div class="product-bundle-item"><img src="${product.image}" alt="${escapeHtml(product.title)}"><span>${escapeHtml(product.title)}</span><strong>${formatPrice(product.price)}</strong></div>`).join(`<span class="product-bundle-plus">+</span>`);
   document.getElementById("bundleTotal").textContent = formatPrice(bundle.reduce((total, product) => total + product.price, 0) * 0.85);
}

function openQuickView(product) {
   document.getElementById("quickViewImage").src = product.image;
   document.getElementById("quickViewImage").alt = product.title;
   document.getElementById("quickViewCategory").textContent = `${product.brand} · ${product.displayCategory}`;
   document.getElementById("productQuickViewTitle").textContent = product.title;
   document.getElementById("quickViewRating").innerHTML = `<i class="bi bi-star-fill"></i> ${product.rating.rate} from ${product.rating.count} verified shoppers`;
   document.getElementById("quickViewDescription").textContent = `${product.description} ${product.warrantyInformation || "Backed by Avyora quality support."}`;
   document.getElementById("quickViewPrice").textContent = formatPrice(product.price);
   document.querySelector("#productQuickView .product-add-button").onclick = function () {
      addToCart(product, false);
   };
   const modal = document.getElementById("productQuickView");
   if (window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(modal).show();
}

function formatPrice(priceInUsd) {
   return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
   }).format(Math.round(priceInUsd * USD_TO_INR));
}

function addToCart(product, buyNow) {
   cartItems.push({ id: product.id, title: product.title, price: product.price, image: product.image });
   localStorage.setItem("avyora-cart", JSON.stringify(cartItems));
   updateCartCount();
   renderCartDrawer();
   showCartMessage(buyNow ? "Added to cart. Ready for checkout." : `${product.title} added to cart.`);
}

function updateCartCount() {
   const cartCount = document.getElementById("cartCount");

   if (cartCount) {
      cartCount.textContent = cartItems.length;
      cartCount.classList.toggle("has-items", cartItems.length > 0);
   }
}

function updateWishlistCount() {
   const wishlistCount = document.getElementById("wishlistCount");

   if (wishlistCount) {
      wishlistCount.textContent = wishlistItems.length;
      wishlistCount.classList.toggle("has-items", wishlistItems.length > 0);
   }
}

function bindWishlistDrawer() {
   document.querySelectorAll("[data-wishlist-trigger]").forEach(function (trigger) {
      trigger.addEventListener("click", openWishlistDrawer);
   });

   document.querySelectorAll("[data-wishlist-close]").forEach(function (closeButton) {
      closeButton.addEventListener("click", closeWishlistDrawer);
   });
}

function bindCartDrawer() {
   document.querySelectorAll("[data-cart-trigger]").forEach(function (trigger) {
      trigger.addEventListener("click", openCartDrawer);
   });

   document.querySelectorAll("[data-cart-close]").forEach(function (closeButton) {
      closeButton.addEventListener("click", closeCartDrawer);
   });
}

function openCartDrawer() {
   const drawer = document.getElementById("cartDrawer");
   drawer.classList.add("is-open");
   drawer.setAttribute("aria-hidden", "false");
   document.body.classList.add("wishlist-drawer-open");
   renderCartDrawer();
}

function closeCartDrawer() {
   const drawer = document.getElementById("cartDrawer");
   drawer.classList.remove("is-open");
   drawer.setAttribute("aria-hidden", "true");
   document.body.classList.remove("wishlist-drawer-open");
}

function renderCartDrawer() {
   const body = document.getElementById("cartDrawerBody");
   const total = document.getElementById("cartDrawerTotal");

   if (!body || !total) return;

   total.textContent = formatPrice(cartItems.reduce((sum, item) => sum + item.price, 0));

   if (!cartItems.length) {
      body.innerHTML = `<div class="cart-empty"><i class="bi bi-bag"></i><h3>Your cart is waiting.</h3><p>Add something useful, beautiful, or both.</p></div>`;
      return;
   }

   body.innerHTML = cartItems.map(function (item, index) {
      return `<article class="cart-drawer-item">
         <img src="${item.image}" alt="${escapeHtml(item.title)}">
         <div class="cart-drawer-item-info"><span>AVYORA PICK</span><h3>${escapeHtml(item.title)}</h3><strong>${formatPrice(item.price)}</strong></div>
         <button type="button" class="cart-drawer-remove" aria-label="Remove ${escapeHtml(item.title)}" data-cart-remove="${index}"><i class="bi bi-trash3"></i></button>
      </article>`;
   }).join("");

   body.querySelectorAll("[data-cart-remove]").forEach(function (button) {
      button.addEventListener("click", function () {
         cartItems.splice(Number(button.dataset.cartRemove), 1);
         localStorage.setItem("avyora-cart", JSON.stringify(cartItems));
         updateCartCount();
         renderCartDrawer();
      });
   });
}

function openWishlistDrawer() {
   const drawer = document.getElementById("wishlistDrawer");
   drawer.classList.add("is-open");
   drawer.setAttribute("aria-hidden", "false");
   document.body.classList.add("wishlist-drawer-open");
   renderWishlistDrawer();
}

function closeWishlistDrawer() {
   const drawer = document.getElementById("wishlistDrawer");
   drawer.classList.remove("is-open");
   drawer.setAttribute("aria-hidden", "true");
   document.body.classList.remove("wishlist-drawer-open");
}

function renderWishlistDrawer() {
   const body = document.getElementById("wishlistDrawerBody");
   const count = document.getElementById("wishlistDrawerCount");

   if (!body || !count) return;

   const savedProducts = wishlistItems
      .map(id => products.find(product => product.id === id))
      .filter(Boolean);

   count.textContent = savedProducts.length;

   if (!savedProducts.length) {
      body.innerHTML = `<div class="wishlist-empty"><i class="bi bi-heart"></i><h3>Your wishlist is waiting.</h3><p>Save pieces you love and they will appear here.</p></div>`;
      return;
   }

   body.innerHTML = savedProducts.map(function (product) {
      return `<article class="wishlist-drawer-item" data-wishlist-product="${product.id}">
         <img src="${product.image}" alt="${escapeHtml(product.title)}">
         <div class="wishlist-drawer-item-info"><span>${escapeHtml(product.category)}</span><h3>${escapeHtml(product.title)}</h3><strong>${formatPrice(product.price)}</strong><button type="button" class="wishlist-drawer-cart"><i class="bi bi-cart-plus"></i> Add to cart</button></div>
         <button type="button" class="wishlist-drawer-remove" aria-label="Remove ${escapeHtml(product.title)}" data-wishlist-remove="${product.id}"><i class="bi bi-trash3"></i></button>
      </article>`;
   }).join("");

   body.querySelectorAll("[data-wishlist-remove]").forEach(function (button) {
      button.addEventListener("click", function () {
         removeFromWishlist(Number(button.dataset.wishlistRemove));
      });
   });

   body.querySelectorAll(".wishlist-drawer-cart").forEach(function (button) {
      button.addEventListener("click", function () {
         const productId = Number(button.closest("[data-wishlist-product]").dataset.wishlistProduct);
         const product = products.find(item => item.id === productId);
         if (product) addToCart(product, false);
      });
   });
}

function removeFromWishlist(productId) {
   wishlistItems = wishlistItems.filter(id => id !== productId);
   localStorage.setItem("avyora-wishlist", JSON.stringify(wishlistItems));
   updateWishlistCount();
   renderProducts();
   renderWishlistDrawer();
}

function showCartMessage(message) {
   let toast = document.getElementById("cartToast");

   if (!toast) {
      toast = document.createElement("div");
      toast.id = "cartToast";
      toast.className = "cart-toast";
      document.body.appendChild(toast);
   }

   toast.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${escapeHtml(message)}`;
   toast.classList.add("show");
   window.clearTimeout(toast.hideTimer);
   toast.hideTimer = window.setTimeout(function () {
      toast.classList.remove("show");
   }, 2600);
}

function escapeHtml(value) {
   return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}
