/* ==================================================
   AVYORA - MAIN JAVASCRIPT
   File: src/main.js
   ================================================== */

import "./style.css";

const PRODUCT_API_URL = "https://dummyjson.com/products?limit=0";
const USD_TO_INR = 83.5;
const BUNDLE_DISCOUNT_RATE = 0.15;
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
let wishlistItems = normalizeWishlistIds(JSON.parse(localStorage.getItem("avyora-wishlist") || "[]"));
let wishlistProducts = JSON.parse(localStorage.getItem("avyora-wishlist-products") || "{}");
let featuredIndex = 0;
let featuredProducts = [];
let featuredTimer;
let styleQuizAnswers = [];
let bundleSelection = [];

function normalizeWishlistIds(ids) {
   const normalized = (Array.isArray(ids) ? ids : [])
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0);

   return [...new Set(normalized)];
}

document.addEventListener("DOMContentLoaded", function () {
   bindProductControls();
   updateCartCount();
   updateWishlistCount();
   bindWishlistDrawer();
   bindCartDrawer();
   bindFeaturedCarousel();
   bindStyleQuiz();
   initCartPage();
   initFavoritesPage();
   initSuccessPage();
   initAccountPage();
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

   wishlistItems.forEach(function (id) {
      const product = products.find(item => item.id === id);
      if (product && !wishlistProducts[id]) wishlistProducts[id] = product;
   });
   localStorage.setItem("avyora-wishlist-products", JSON.stringify(wishlistProducts));

   updateHeroMoods();
   renderProducts();
   setFeaturedProducts(products);
   renderBundle(products.slice(0, 6));
   renderWishlistDrawer();
   renderFavoritesPage();
   updateWishlistCount();
   startFeaturedCarousel();
}

function bindStyleQuiz() {
   const quiz = document.getElementById("styleQuiz");
   const question = document.getElementById("styleQuizQuestion");
   const options = document.getElementById("styleQuizOptions");
   const step = document.getElementById("styleQuizStep");
   const result = document.getElementById("styleQuizResult");
   if (!quiz || !question || !options || !step || !result) return;

   const questions = [
      {
         text: "What are you shopping for today?",
         choices: [
            ["power", "electronics", "bi-lightning-charge", "Useful upgrades"],
            ["style", "womenswear", "bi-stars", "A little polish"],
            ["home", "home", "bi-house-heart", "Make home better"]
         ]
      },
      {
         text: "What should your picks feel like?",
         choices: [
            ["smart", "electronics", "bi-cpu", "Smart and capable"],
            ["soft", "womenswear", "bi-cloud", "Soft and considered"],
            ["fresh", "home", "bi-brightness-high", "Fresh and calm"]
         ]
      },
      {
         text: "What matters most right now?",
         choices: [
            ["function", "electronics", "bi-check2-circle", "Everyday function"],
            ["expression", "accessories", "bi-palette", "Personal expression"],
            ["comfort", "home", "bi-heart", "More comfort"]
         ]
      }
   ];

   function renderQuestion() {
      const currentQuestion = questions[styleQuizAnswers.length];
      step.textContent = `${styleQuizAnswers.length + 1} / ${questions.length}`;
      question.textContent = currentQuestion.text;
      options.innerHTML = currentQuestion.choices.map(choice => `<button type="button" data-quiz-value="${choice[0]}" data-quiz-filter="${choice[1]}"><i class="bi ${choice[2]}"></i><span>${choice[3]}</span></button>`).join("");
      options.querySelectorAll("button").forEach(button => button.addEventListener("click", function () {
         styleQuizAnswers.push(button.dataset.quizFilter);
         if (styleQuizAnswers.length < questions.length) {
            renderQuestion();
            return;
         }

         const filter = styleQuizAnswers.sort((a, b) => styleQuizAnswers.filter(item => item === b).length - styleQuizAnswers.filter(item => item === a).length)[0];
         const label = { electronics: "capable upgrades", womenswear: "polished favorites", accessories: "expressive details", home: "comfort-first finds" }[filter] || "everyday favorites";
         result.hidden = false;
         result.innerHTML = `Your edit is ready: <strong>${label}</strong> <button type="button" id="styleQuizShop">Shop it <i class="bi bi-arrow-right"></i></button>`;
         options.innerHTML = `<button type="button" class="style-quiz-restart" id="styleQuizRestart"><i class="bi bi-arrow-counterclockwise"></i><span>Retake quiz</span></button>`;
         step.textContent = "DONE";
         document.getElementById("styleQuizShop").addEventListener("click", function () {
            document.querySelector(`.product-tab[data-filter="${filter}"]`)?.click();
            document.getElementById("product-edit")?.scrollIntoView({ behavior: "smooth" });
         });
         document.getElementById("styleQuizRestart").addEventListener("click", function () {
            styleQuizAnswers = [];
            result.hidden = true;
            renderQuestion();
         });
      }));
   }

   renderQuestion();
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

   const querySearch = new URLSearchParams(window.location.search).get("search") || "";
   const productSearch = document.getElementById("productSearch");
   if (productSearch && querySearch) {
      productSearch.value = querySearch;
      searchTerm = querySearch.trim().toLowerCase();
   }

   document.querySelectorAll("[data-product-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
         event.preventDefault();
         const value = String(form.querySelector("input")?.value || "").trim();
         if (!value) return;

         if (productSearch) {
            productSearch.value = value;
            searchTerm = value.toLowerCase();
            renderProducts();
            document.getElementById("product-edit")?.scrollIntoView({ behavior: "smooth" });
            return;
         }

         window.location.href = `index.html?search=${encodeURIComponent(value)}#product-edit`;
      });
   });

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

   if (productSearch && querySearch) renderProducts();

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

   const featuredPanel = document.querySelector(".product-feature-panel");
   if (featuredPanel) featuredPanel.hidden = Boolean(searchTerm);

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
            delete wishlistProducts[productId];
         } else if (!wishlistItems.includes(productId)) {
            wishlistItems.push(productId);
            wishlistProducts[productId] = product;
         }

         localStorage.setItem("avyora-wishlist", JSON.stringify(wishlistItems));
         localStorage.setItem("avyora-wishlist-products", JSON.stringify(wishlistProducts));
         updateWishlistCount();
         renderWishlistDrawer();
         renderFavoritesPage();
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
   if (!bundleSelection.length) bundleSelection = bundle.slice(0, 3).map(product => product.id);
   container.innerHTML = bundle.map(function (product) {
      const isSelected = bundleSelection.includes(product.id);
      return `<button class="product-bundle-item${isSelected ? " selected" : ""}" type="button" data-bundle-product="${product.id}" aria-pressed="${isSelected}"><img src="${product.image}" alt="${escapeHtml(product.title)}"><span>${escapeHtml(product.title)}</span><strong>${formatPrice(product.price)}</strong><i class="bi ${isSelected ? "bi-check-circle-fill" : "bi-plus-circle"}"></i></button>`;
   }).join("");

   container.querySelectorAll("[data-bundle-product]").forEach(function (button) {
      button.addEventListener("click", function () {
         const productId = Number(button.dataset.bundleProduct);
         if (bundleSelection.includes(productId)) {
            bundleSelection = bundleSelection.filter(id => id !== productId);
         } else if (bundleSelection.length < 3) {
            bundleSelection.push(productId);
         } else {
            showCartMessage("Choose up to three items for your bundle.");
            return;
         }
         renderBundle(bundle);
      });
   });

   const selectedProducts = bundle.filter(product => bundleSelection.includes(product.id));
   document.getElementById("bundleTotal").textContent = formatPrice(selectedProducts.reduce((total, product) => total + product.price, 0) * 0.85);
   document.getElementById("bundleSelectionLabel").textContent = `${selectedProducts.length} item${selectedProducts.length === 1 ? "" : "s"} selected`;
   document.getElementById("claimBundleButton").onclick = function () {
      if (!selectedProducts.length) {
         showCartMessage("Choose at least one item for your bundle.");
         return;
      }
      selectedProducts.forEach(product => addToCart(product, false));
      showCartMessage(`${selectedProducts.length}-item bundle added to cart.`);
   };
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

function getCartPricing() {
   const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
   const priceSequence = cartItems.flatMap(item => Array.from({ length: item.quantity || 1 }, () => item.price));
   const eligibleItemCount = Math.floor(itemCount / 3) * 3;
   const eligibleSubtotal = priceSequence.slice(0, eligibleItemCount).reduce((sum, price) => sum + price, 0);
   const savings = eligibleSubtotal * BUNDLE_DISCOUNT_RATE;

   return {
      subtotal: cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
      savings,
      total: cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) - savings,
      eligibleItemCount,
      nextBundleCount: itemCount % 3 === 0 ? 0 : 3 - (itemCount % 3)
   };
}

function initSuccessPage() {
   const orderIdEl = document.getElementById("successOrderId");
   const orderCustomerEl = document.getElementById("successCustomer");
   const orderTotalEl = document.getElementById("successTotal");
   const orderEmailEl = document.getElementById("successEmail");
   const orderItemsEl = document.getElementById("successItems");

   if (!orderIdEl && !orderCustomerEl && !orderTotalEl && !orderEmailEl && !orderItemsEl) return;

   const order = JSON.parse(localStorage.getItem("avyora-last-order") || "null");
   if (!order) {
      orderIdEl.textContent = "No active order";
      return;
   }

   orderIdEl.textContent = order.id;
   orderCustomerEl.textContent = order.customer;
   orderTotalEl.textContent = formatPrice(order.total || 0);
   orderEmailEl.textContent = order.email;
   orderItemsEl.textContent = `${order.items || 0} item${(order.items || 0) === 1 ? "" : "s"} in this order`;
}

function initAccountPage() {
   const accountPage = document.getElementById("accountPage");
   if (!accountPage) return;

   const order = JSON.parse(localStorage.getItem("avyora-last-order") || "null");
   const emptyState = document.getElementById("accountEmpty");
   const orderCard = document.getElementById("accountOrder");

   if (!order) {
      emptyState.hidden = false;
      orderCard.hidden = true;
      return;
   }

   document.getElementById("accountCustomer").textContent = order.customer || "AVYORA shopper";
   document.getElementById("accountEmail").textContent = order.email || "";
   document.getElementById("accountOrderId").textContent = order.id || "--";
   document.getElementById("accountOrderTotal").textContent = formatPrice(order.total || 0);
   document.getElementById("accountOrderItems").textContent = `${order.items || 0} item${(order.items || 0) === 1 ? "" : "s"}`;
   document.getElementById("accountOrderDate").textContent = order.placedAt
      ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(order.placedAt))
      : "Recently placed";
   emptyState.hidden = true;
   orderCard.hidden = false;
}

function initCartPage() {
   const cartPageItems = document.getElementById("cartPageItems");
   const checkoutForm = document.getElementById("checkoutForm");
   const continueShopping = document.getElementById("continueShopping");

   if (!cartPageItems && !checkoutForm) return;

   renderCartPage();

   if (checkoutForm) {
      checkoutForm.addEventListener("submit", function (event) {
         event.preventDefault();

         if (!cartItems.length) {
            showCartMessage("Add an item before placing your order.");
            return;
         }

         const formData = new FormData(checkoutForm);
         const name = String(formData.get("fullName") || "").trim();
         const email = String(formData.get("email") || "").trim();
         const address = String(formData.get("address") || "").trim();
         const city = String(formData.get("city") || "").trim();

         if (!name || !email || !address || !city) {
            showCartMessage("Please complete the shipping details.");
            return;
         }

         const pricing = getCartPricing();
         const shippingFee = 249;
         const order = {
            id: `AVY-${Date.now()}`,
            customer: name,
            email,
            items: cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
            total: pricing.total + shippingFee,
            placedAt: new Date().toISOString()
         };

         localStorage.setItem("avyora-last-order", JSON.stringify(order));
         cartItems = [];
         localStorage.setItem("avyora-cart", JSON.stringify(cartItems));
         updateCartCount();
         renderCartDrawer();
         renderCartPage();
         checkoutForm.reset();

         showCartMessage("Order placed successfully.");
         window.location.href = "success.html";
      });
   }

   if (continueShopping) {
      continueShopping.addEventListener("click", function () {
         window.location.href = "index.html";
      });
   }
}

function renderCartPage() {
   const cartPageItems = document.getElementById("cartPageItems");
   const cartPageEmpty = document.getElementById("cartPageEmpty");
   const checkoutButton = document.getElementById("checkoutButton");
   const subtotalEl = document.getElementById("checkoutSubtotal");
   const shippingEl = document.getElementById("checkoutShipping");
   const savingsEl = document.getElementById("checkoutSavings");
   const totalEl = document.getElementById("checkoutTotal");

   if (!cartPageItems || !subtotalEl || !shippingEl || !savingsEl || !totalEl) return;

   const pricing = getCartPricing();
   const shippingFee = cartItems.length ? 249 : 0;
   const finalTotal = Math.max(0, pricing.total + shippingFee);

   subtotalEl.textContent = formatPrice(pricing.subtotal);
   shippingEl.textContent = formatPrice(shippingFee);
   savingsEl.textContent = pricing.savings > 0 ? `- ${formatPrice(pricing.savings)}` : formatPrice(0);
   totalEl.textContent = formatPrice(finalTotal);

   if (checkoutButton) {
      checkoutButton.disabled = cartItems.length === 0;
      checkoutButton.classList.toggle("disabled", cartItems.length === 0);
   }

   if (!cartItems.length) {
      cartPageEmpty.hidden = false;
      cartPageItems.innerHTML = "";
      return;
   }

   cartPageEmpty.hidden = true;
   cartPageItems.innerHTML = cartItems.map(function (item, index) {
      const quantity = item.quantity || 1;
      const lineTotal = item.price * quantity;
      return `
         <article class="cart-page-item" data-cart-page-item="${index}">
            <img src="${item.image}" alt="${escapeHtml(item.title)}">
            <div class="cart-page-item-info">
               <span class="section-kicker">AVYORA PICK</span>
               <h3>${escapeHtml(item.title)}</h3>
               <div class="cart-page-item-meta">
                  <strong>${formatPrice(lineTotal)}</strong>
                  <span>${formatPrice(item.price)} each</span>
               </div>
               <div class="cart-page-item-actions">
                  <div class="cart-page-item-qty" aria-label="Quantity selector">
                     <button type="button" class="qty-button" data-cart-qty-change="${index}" data-cart-qty-delta="-1" aria-label="Decrease quantity">-</button>
                     <span>${quantity}</span>
                     <button type="button" class="qty-button" data-cart-qty-change="${index}" data-cart-qty-delta="1" aria-label="Increase quantity">+</button>
                  </div>
                  <button type="button" class="cart-page-remove" data-cart-page-remove="${index}">Remove</button>
               </div>
            </div>
         </article>
      `;
   }).join("");

   cartPageItems.querySelectorAll("[data-cart-page-remove]").forEach(function (button) {
      button.addEventListener("click", function () {
         const index = Number(button.dataset.cartPageRemove);
         cartItems.splice(index, 1);
         localStorage.setItem("avyora-cart", JSON.stringify(cartItems));
         updateCartCount();
         renderCartDrawer();
         renderCartPage();
      });
   });

   cartPageItems.querySelectorAll("[data-cart-qty-change]").forEach(function (button) {
      button.addEventListener("click", function () {
         const index = Number(button.dataset.cartQtyChange);
         const delta = Number(button.dataset.cartQtyDelta);
         const item = cartItems[index];

         if (!item) return;

         const nextQuantity = (item.quantity || 1) + delta;
         if (nextQuantity <= 0) {
            cartItems.splice(index, 1);
         } else {
            item.quantity = nextQuantity;
         }

         localStorage.setItem("avyora-cart", JSON.stringify(cartItems));
         updateCartCount();
         renderCartDrawer();
         renderCartPage();
      });
   });
}

function addToCart(product, buyNow) {
   const existingItem = cartItems.find(item => item.id === product.id);

   if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
   } else {
      cartItems.push({ id: product.id, title: product.title, price: product.price, image: product.image, quantity: 1 });
   }

   localStorage.setItem("avyora-cart", JSON.stringify(cartItems));
   updateCartCount();
   renderCartDrawer();
   showCartMessage(buyNow ? "Added to cart. Ready for checkout." : `${product.title} added to cart.`);
}

function updateCartCount() {
   const cartCount = document.getElementById("cartCount");
   const cartTotal = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

   if (cartCount) {
      cartCount.textContent = cartTotal;
      cartCount.classList.toggle("has-items", cartTotal > 0);
   }
}

function updateWishlistCount() {
   wishlistItems = normalizeWishlistIds(wishlistItems);
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

   const pricing = getCartPricing();
   total.innerHTML = pricing.savings > 0
      ? `<del>${formatPrice(pricing.subtotal)}</del> ${formatPrice(pricing.total)} <small>-${formatPrice(pricing.savings)}</small>`
      : formatPrice(pricing.total);

   if (!cartItems.length) {
      body.innerHTML = `<div class="cart-empty"><i class="bi bi-bag"></i><h3>Your cart is waiting.</h3><p>Add something useful, beautiful, or both.</p></div>`;
      return;
   }

   const promotionMessage = pricing.nextBundleCount > 0
      ? `<p class="cart-promotion-note"><i class="bi bi-stars"></i> Add ${pricing.nextBundleCount} more item${pricing.nextBundleCount === 1 ? "" : "s"} to unlock 15% off the next bundle.</p>`
      : `<p class="cart-promotion-note active"><i class="bi bi-check-circle"></i> 15% bundle savings applied to ${pricing.eligibleItemCount} items.</p>`;

   body.innerHTML = promotionMessage + cartItems.map(function (item, index) {
      const quantity = item.quantity || 1;
      const lineTotal = item.price * quantity;
      return `<article class="cart-drawer-item">
         <img src="${item.image}" alt="${escapeHtml(item.title)}">
         <div class="cart-drawer-item-info"><span>AVYORA PICK</span><h3>${escapeHtml(item.title)}</h3><strong>${formatPrice(lineTotal)}</strong><small class="cart-drawer-qty">Qty: ${quantity}</small></div>
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

function initFavoritesPage() {
   const favoritesGrid = document.getElementById("favoritesPageItems");
   const emptyState = document.getElementById("favoritesPageEmpty");
   if (!favoritesGrid && !emptyState) return;

   renderFavoritesPage();
}

function renderFavoritesPage() {
   wishlistItems = normalizeWishlistIds(wishlistItems);
   const favoritesGrid = document.getElementById("favoritesPageItems");
   const emptyState = document.getElementById("favoritesPageEmpty");
   const countEl = document.getElementById("favoritesPageCount");

   if (!favoritesGrid && !emptyState) return;

   const savedProducts = wishlistItems
      .map(id => products.find(product => product.id === id) || wishlistProducts[id])
      .filter(Boolean);

   if (countEl) countEl.textContent = `${savedProducts.length} saved item${savedProducts.length === 1 ? "" : "s"}`;

   if (!favoritesGrid || !emptyState) return;

   if (!savedProducts.length) {
      favoritesGrid.innerHTML = "";
      emptyState.hidden = false;
      return;
   }

   emptyState.hidden = true;
   favoritesGrid.innerHTML = savedProducts.map(function (product) {
      return `
         <article class="favorites-page-item" data-favorites-product="${product.id}">
            <img src="${product.image}" alt="${escapeHtml(product.title)}">
            <div class="favorites-page-detail">
               <span class="section-kicker">${escapeHtml(product.category)}</span>
               <h3>${escapeHtml(product.title)}</h3>
               <p>${escapeHtml(product.description)}</p>
               <div class="favorites-page-meta">
                  <strong>${formatPrice(product.price)}</strong>
                  <span><i class="bi bi-star-fill"></i> ${product.rating.rate}</span>
               </div>
               <div class="favorites-page-actions">
                  <button type="button" class="btn btn-avyora favorites-add-cart" data-favorites-add="${product.id}"><i class="bi bi-cart-plus"></i> Add to cart</button>
                  <button type="button" class="favorites-remove" data-favorites-remove="${product.id}">Remove</button>
               </div>
            </div>
         </article>
      `;
   }).join("");

   favoritesGrid.querySelectorAll("[data-favorites-remove]").forEach(function (button) {
      button.addEventListener("click", function () {
         const productId = Number(button.dataset.favoritesRemove);
         removeFromWishlist(productId);
      });
   });

   favoritesGrid.querySelectorAll("[data-favorites-add]").forEach(function (button) {
      button.addEventListener("click", function () {
         const productId = Number(button.dataset.favoritesAdd);
         const product = products.find(item => item.id === productId);
         if (product) {
            addToCart(product, false);
         }
      });
   });
}

function renderWishlistDrawer() {
   wishlistItems = normalizeWishlistIds(wishlistItems);
   const body = document.getElementById("wishlistDrawerBody");
   const count = document.getElementById("wishlistDrawerCount");

   if (!body || !count) return;

   const savedProducts = wishlistItems
      .map(id => products.find(product => product.id === id) || wishlistProducts[id])
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
   delete wishlistProducts[productId];
   localStorage.setItem("avyora-wishlist", JSON.stringify(wishlistItems));
   localStorage.setItem("avyora-wishlist-products", JSON.stringify(wishlistProducts));
   updateWishlistCount();
   renderProducts();
   renderWishlistDrawer();
   renderFavoritesPage();
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
