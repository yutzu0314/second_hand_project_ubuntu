// buyer.js

/// ==== 讀取登入資訊（買家） ====
let currentUser = null;

function loadCurrentUser() {
  try {
    const raw = localStorage.getItem("auth");
    if (raw && raw !== "null" && raw !== "undefined") {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.role === "buyer") {
        return parsed;
      }
    }
  } catch (e) {
    console.error("parse auth failed", e);
  }

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

const API_BASE = ""; // 與後端同網域就留空

let products = [];
const productList = document.getElementById("productList");

// ================= 商品列表 =================

async function fetchProducts() {
  try {
    const resp = await fetch(`${API_BASE}/api/products/list?status=on_sale`);
    if (!resp.ok) {
      throw new Error("商品列表載入失敗");
    }
    const data = await resp.json(); // { total, items }
    products = data.items || [];
    renderProducts(products);
  } catch (err) {
    console.error(err);
    productList.innerHTML = "<p>無法載入商品，請稍後再試。</p>";
  }
}

function renderProducts(list) {
  productList.innerHTML = "";

  if (!list.length) {
    productList.innerHTML = "<p>目前沒有上架中的商品。</p>";
    return;
  }

  list.forEach((p) => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      <div class="product-img">
        <img src="${p.cover_image_url || "images/default.png"}" alt="${p.title}">
      </div>
      <div class="product-tag">賣家 ID：${p.seller_id}</div>
      <h3>${p.title}</h3>
      <p class="price">NT$ ${p.price}</p>
      <button class="save-btn" data-id="${p.product_id}">加入購物車</button>
    `;

    productList.appendChild(card);
  });
}

fetchProducts();

// ================= 購物車 =================

let cart = [];
const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const checkoutModal = document.getElementById("checkoutModal");
const closeModal = document.getElementById("closeModal");
const confirmOrder = document.getElementById("confirmOrder");
const cartItems = document.getElementById("cartItems");

function updateCartDisplay() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = "<li>目前購物車是空的</li>";
    cartCount.textContent = "0";
    return;
  }

  cart.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - NT$ ${item.price}`;
    cartItems.appendChild(li);
  });

  cartCount.textContent = String(cart.length);
}

// === 加入購物車 ===
document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("save-btn")) return;

  const productId = Number(e.target.dataset.id);
  const product = products.find((p) => p.product_id === productId);
  if (!product) return;

  cart.push({
    product_id: product.product_id,
    name: product.title,
    price: product.price,
    seller_id: product.seller_id,
  });

  updateCartDisplay();

  const addedModal = document.getElementById("addedModal");
  addedModal.classList.remove("hidden");

  document.getElementById("continueShopping").onclick = () => {
    addedModal.classList.add("hidden");
  };

  document.getElementById("goToCheckout").onclick = () => {
    addedModal.classList.add("hidden");
    updateCartDisplay();
    checkoutModal.classList.remove("hidden");
  };
});

// === 打開購物車 ===
cartBtn.addEventListener("click", (e) => {
  e.preventDefault();
  updateCartDisplay();
  checkoutModal.classList.remove("hidden");
});

// === 關閉購物車 ===
closeModal.addEventListener("click", () => {
  checkoutModal.classList.add("hidden");
});

// === 確認下單 ===
confirmOrder.addEventListener("click", async () => {
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
        headers: {
          "Content-Type": "application/json",
        },
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

    cart = [];
    updateCartDisplay();
    checkoutModal.classList.add("hidden");

    localStorage.setItem("lastCreatedOrders", JSON.stringify(createdOrders));
  } catch (e) {
    console.error(e);
    alert("建立訂單時發生錯誤，請稍後再試");
  }
});

// === 搜尋功能 ===
document.getElementById("searchBtn").addEventListener("click", () => {
  const keyword = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  if (!keyword) {
    renderProducts(products);
    return;
  }

  const filtered = products.filter((p) =>
    (p.title || "").toLowerCase().includes(keyword)
  );

  renderProducts(filtered);
});
