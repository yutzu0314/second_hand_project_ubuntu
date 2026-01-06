// buyer.js

/// ==== 讀取登入資訊（買家） ====
let currentUser = null;

function loadCurrentUser() {
  try {
<<<<<<< Updated upstream
    const raw = localStorage.getItem("auth");
    if (raw && raw !== "null" && raw !== "undefined") {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.role === "buyer") {
=======
    // 優先用 auth
    const raw = localStorage.getItem("auth");
    if (raw && raw !== "null" && raw !== "undefined") {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && (parsed.role === "buyer" || parsed.role === "seller")) {
>>>>>>> Stashed changes
        return parsed;
      }
    }
  } catch (e) {
    console.error("parse auth failed", e);
  }

<<<<<<< Updated upstream
=======
  // 如果沒有 auth，就退回舊欄位（user_id / role）
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
const API_BASE = ""; // 與後端同網域就留空
=======

const API_BASE = ""; // 跟後端同網域就留空
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
=======
// 用後端欄位渲染商品卡片
>>>>>>> Stashed changes
function renderProducts(list) {
  productList.innerHTML = "";
  if (!list.length) {
    productList.innerHTML = "<p>目前沒有上架中的商品。</p>";
    return;
  }

  // 已檢舉清單（防止重複檢舉）
  let reports = JSON.parse(localStorage.getItem("reports")) || [];

  if (!list.length) {
    productList.innerHTML = "<p>目前沒有上架中的商品。</p>";
    return;
  }

  list.forEach((p) => {
    const card = document.createElement("div");
    card.classList.add("product-card");
<<<<<<< HEAD

    const reported = reports.includes(p.name);

    card.innerHTML = `
<<<<<<< Updated upstream
      <div class="product-img">
        <img src="${p.cover_image_url || "images/default.png"}" alt="${p.title}">
      </div>
      <div class="product-tag">賣家 ID：${p.seller_id}</div>
      <h3>${p.title}</h3>
      <p class="price">NT$ ${p.price}</p>
      <button class="save-btn" data-id="${p.product_id}">加入購物車</button>
    `;
=======
      <div class="seller">
        <img src="images/user.png" alt="seller">
        <p>${p.seller}</p>
      </div>

      <div class="product-info">
        <div class="tag">${p.tag}</div>
        <img src="${p.img}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p class="price">NT$ ${p.price}</p>
>>>>>>> Stashed changes

        <button class="save-btn add-cart-btn">加入購物車</button>

        <button class="report-btn" data-name="${p.name}" ${reported ? "disabled" : ""}>
          ${reported ? "已檢舉" : "⚠ 檢舉商品"}
        </button>
=======
    card.innerHTML = `
      <div class="product-img">
        <img src="${p.cover_image_url || "images/default.png"}" alt="${p.title}">
>>>>>>> 4a3928c8a8911280224803de55313c3a35cfa952
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
<<<<<<< Updated upstream

// ================= 購物車 =================

=======

// ================= 購物車 =================
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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

=======
<<<<<<< HEAD
  if (e.target.classList.contains("add-cart-btn")) {
    const card = e.target.closest(".product-card");
    const name = card.querySelector("h3").textContent;

    const priceText = card.querySelector(".price").textContent.replace("NT$", "").trim();
    const price = parseInt(priceText);

    cart.push({ name, price, qty: 1 });
    cartCount.textContent = cart.length;

    const addedModal = document.getElementById("addedModal");
    addedModal.classList.remove("hidden");
=======
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

  // 顯示提示 modal
  const addedModal = document.getElementById("addedModal");
  addedModal.classList.remove("hidden");
>>>>>>> 4a3928c8a8911280224803de55313c3a35cfa952

  document.getElementById("continueShopping").onclick = () => {
    addedModal.classList.add("hidden");
  };

>>>>>>> Stashed changes
  document.getElementById("goToCheckout").onclick = () => {
    addedModal.classList.add("hidden");
    updateCartDisplay();
    checkoutModal.classList.remove("hidden");
  };
<<<<<<< Updated upstream
=======
});

// === 檢舉商品 ===
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("report-btn")) {
    const name = e.target.dataset.name;

    let reports = JSON.parse(localStorage.getItem("reports")) || [];

    if (reports.includes(name)) {
      alert("⚠ 你已經檢舉過這個商品！");
      return;
    }

    reports.push(name);
    localStorage.setItem("reports", JSON.stringify(reports));

    alert(`⚠ 已回報商品問題：「${name}」`);

    e.target.textContent = "已檢舉";
    e.target.disabled = true;
  }
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
          // 如果之後有 token，要一起帶：
          // "Authorization": `Bearer ${auth.token}`,
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
    // 清空購物車
>>>>>>> Stashed changes
    cart = [];
    updateCartDisplay();
    checkoutModal.classList.add("hidden");

<<<<<<< Updated upstream
=======
    // 可選：暫存最後建立的訂單資訊
>>>>>>> Stashed changes
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
