/// =======================
/// 讀取登入資訊（買家）
/// =======================
let currentUser = null;

function loadCurrentUser() {
  try {
    const raw = localStorage.getItem("auth");
    if (raw && raw !== "null" && raw !== "undefined") {
      const parsed = JSON.parse(raw);
      // 買家頁只接受 buyer
      if (parsed && parsed.id && parsed.role === "buyer") return parsed;
    }
  } catch (e) {
    console.error("parse auth failed", e);
  }

  // fallback（舊欄位）
  const idStr = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email") || null;

  if (idStr && role === "buyer") {
    return {
      id: Number(idStr),
      email,
      role,
      token: localStorage.getItem("token") || null,
      name: null,
    };
  }
  return null;
}

currentUser = loadCurrentUser();
console.log("buyer.js currentUser =", currentUser);

/// =======================
/// API base
/// =======================
// 如果前端跟後端同網域/同port可留空；
// 但你現在前端是 localhost:3000，後端通常是 8080/8000，這裡多半要填。
// 例如：const API_BASE = "http://localhost:8080";
const API_BASE = "";

/// =======================
/// DOM
/// =======================
const productList = document.getElementById("productList");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const checkoutModal = document.getElementById("checkoutModal");
const closeModal = document.getElementById("closeModal");
const confirmOrder = document.getElementById("confirmOrder");
const cartItems = document.getElementById("cartItems");

const addedModal = document.getElementById("addedModal");
const continueShoppingBtn = document.getElementById("continueShopping");
const goToCheckoutBtn = document.getElementById("goToCheckout");

/// =======================
/// State
/// =======================
let products = [];
let cart = [];

/// =======================
/// 商品列表
/// =======================
async function fetchProducts({ status = "on_sale", q = "" } = {}) {
  try {
    if (!productList) return;

    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);

    const url = `${API_BASE}/api/products/list?${params.toString()}`;
    console.log("fetchProducts:", url);

    const resp = await fetch(url);
    if (!resp.ok) throw new Error("商品列表載入失敗: " + resp.status);

    const data = await resp.json(); // { total, items }
    products = data.items || [];
    renderProducts(products);
  } catch (err) {
    console.error(err);
    if (productList) productList.innerHTML = "<p>無法載入商品，請稍後再試。</p>";
  }
}

function renderProducts(list) {
  if (!productList) return;
  productList.innerHTML = "";

  if (!Array.isArray(list) || list.length === 0) {
    productList.innerHTML = "<p>目前沒有上架中的商品。</p>";
    return;
  }

  list.forEach((p) => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      <div class="product-img">
        <img src="${p.cover_image_url || "images/default.png"}" alt="${p.title || "product"}">
      </div>
      <div class="product-tag">賣家：${p.seller_username || ("ID:" + p.seller_id)}</div>
      <h3>${p.title || "(無標題)"}</h3>
      <p class="price">NT$ ${p.price ?? "-"}</p>
      <button class="save-btn add-to-cart" data-id="${p.product_id}">加入購物車</button>
    `;

    productList.appendChild(card);
  });
}

/// =======================
/// 購物車
/// =======================
function updateCartDisplay() {
  if (!cartItems || !cartCount) return;

  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = "<li>目前購物車是空的</li>";
    cartCount.textContent = "0";
    return;
  }

  cart.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.title} - NT$ ${item.price}`;
    cartItems.appendChild(li);
  });

  cartCount.textContent = String(cart.length);
}

// 加入購物車（用事件委派）
document.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;

  if (!target.classList.contains("add-to-cart")) return;

  const productId = Number(target.dataset.id);
  const product = products.find((p) => p.product_id === productId);
  if (!product) return;

  const exists = cart.some(i => i.product_id === product.product_id);
  if (exists) {
    alert("此商品已在購物車中（每個商品只能買 1 件）");
    return;
  }


  cart.push({
    product_id: product.product_id,
    title: product.title,
    price: product.price,
    seller_id: product.seller_id,
  });

  updateCartDisplay();

  // 顯示加入購物車提示
  if (addedModal) addedModal.classList.remove("hidden");
});

continueShoppingBtn?.addEventListener("click", () => {
  addedModal?.classList.add("hidden");
});

goToCheckoutBtn?.addEventListener("click", () => {
  addedModal?.classList.add("hidden");
  updateCartDisplay();
  checkoutModal?.classList.remove("hidden");
});

// 打開購物車
cartBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  updateCartDisplay();
  checkoutModal?.classList.remove("hidden");
});

// 關閉購物車
closeModal?.addEventListener("click", () => {
  checkoutModal?.classList.add("hidden");
});

// 確認下單（你原本的 API：/api/order/create）
confirmOrder?.addEventListener("click", async () => {
  if (!currentUser) {
    alert("請先登入買家帳號再下單");
    return;
  }
  if (cart.length === 0) {
    alert("購物車是空的！");
    return;
  }

  try {
    const createdOrders = [];

    for (const item of cart) {
      const resp = await fetch(`${API_BASE}/api/order/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: currentUser.id,
          product_id: item.product_id,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error("create order fail", err);
        alert(`有一筆訂單建立失敗：${err.error || resp.status}`);
        continue;
      }

      const order = await resp.json();
      createdOrders.push(order);
    }

    alert(`✅ 訂單已送出，共 ${createdOrders.length} 筆。\n可到「訂單追蹤」查看。`);

    // 清空購物車
    cart = [];
    updateCartDisplay();
    checkoutModal?.classList.add("hidden");

    localStorage.setItem("lastCreatedOrders", JSON.stringify(createdOrders));
  } catch (e) {
    console.error(e);
    alert("建立訂單時發生錯誤，請稍後再試");
  }
});

/// =======================
/// 搜尋
/// =======================
searchBtn?.addEventListener("click", () => {
  const keyword = (searchInput?.value || "").trim();
  // 推薦：直接用後端 q 搜尋（title/description）
  fetchProducts({ status: "on_sale", q: keyword });
});

/// =======================
/// 初始化
/// =======================
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
});
