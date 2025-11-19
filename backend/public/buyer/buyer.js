// === 模擬商品資料（之後可由賣家系統提供） ===
const products = [
  {
    name: "iPhone 13",
    price: 19000,
    img: "images/iphone13.png",
    tag: "精選商品",
    seller: "SELLER A"
  },
  {
    name: "Switch 主機",
    price: 8500,
    img: "images/switch.png",
    tag: "精選商品",
    seller: "SELLER B"
  },
  {
    name: "AirPods Pro",
    price: 4500,
    img: "images/airpods.png",
    tag: "最新上架",
    seller: "SELLER C"
  },
  {
    name: "MacBook Air",
    price: 28000,
    img: "images/macbook.png",
    tag: "熱銷商品",
    seller: "SELLER D"
  }
];

const productList = document.getElementById("productList");

// === 渲染商品 ===
function renderProducts(list) {
  productList.innerHTML = "";

  list.forEach((p) => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      <div class="seller">
        <img src="images/user.png" alt="seller">
        <p>${p.seller}</p>
      </div>

      <div class="product-info">
        <div class="tag">${p.tag}</div>
        <img src="${p.img}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p class="price">NT$ ${p.price}</p>
        <button class="save-btn">加入購物車</button>
      </div>
    `;

    productList.appendChild(card);
  });
}

renderProducts(products);

// === 購物車 ===
let cart = [];
const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const checkoutModal = document.getElementById("checkoutModal");
const closeModal = document.getElementById("closeModal");
const confirmOrder = document.getElementById("confirmOrder");
const cartItems = document.getElementById("cartItems");

// 更新購物車畫面
function updateCartDisplay() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = "<li>目前購物車是空的</li>";
    return;
  }

  cart.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - NT$${item.price}`;
    cartItems.appendChild(li);
  });
}

// === 加入購物車 ===
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("save-btn")) {
    const card = e.target.closest(".product-card");
    const name = card.querySelector("h3").textContent;

    // 價格處理（轉為數字）
    const priceText = card.querySelector(".price").textContent.replace("NT$", "").trim();
    const price = parseInt(priceText);

    // 格式統一
    cart.push({ name, price, qty: 1 });

    cartCount.textContent = cart.length;

    // 顯示提示 modal
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
  }
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
confirmOrder.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("🛒 購物車是空的！");
    return;
  }

  const order = {
    id: Date.now(),
    items: [...cart],
    status: "已下單",
    date: new Date().toLocaleString()
  };

  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  orders.push(order);
  localStorage.setItem("orders", JSON.stringify(orders));

  alert("✅ 訂單已送出！你可以到『訂單追蹤』查看");

  cart = [];
  cartCount.textContent = 0;

  updateCartDisplay();
  checkoutModal.classList.add("hidden");
});

// === 搜尋功能 ===
document.getElementById("searchBtn").addEventListener("click", () => {
  const keyword = document.getElementById("searchInput").value.trim().toLowerCase();

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(keyword)
  );

  renderProducts(filtered);
});
