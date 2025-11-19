// @ts-nocheck

const products = [
  { id: 1, name: "iPhone 12", price: 12000, img: "https://via.placeholder.com/200x150?text=iPhone12" },
  { id: 2, name: "AirPods Pro", price: 4000, img: "https://via.placeholder.com/200x150?text=AirPods" },
  { id: 3, name: "Switch 主機", price: 8500, img: "https://via.placeholder.com/200x150?text=Switch" },
  { id: 4, name: "二手筆電", price: 15000, img: "https://via.placeholder.com/200x150?text=Laptop" },
  { id: 5, name: "相機鏡頭", price: 9000, img: "https://via.placeholder.com/200x150?text=Lens" },
];

let cart = [];

// ===========================
// 商品渲染
// ===========================
function renderProducts(list) {
  const container = document.getElementById("productList");
  container.innerHTML = "";
  list.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>NT$${p.price}</p>
      <button onclick="addToCart(${p.id})">加入購物車</button>
    `;
    container.appendChild(card);
  });
}

// ===========================
// 購物車加入
// ===========================
function addToCart(id) {
  const item = products.find(p => p.id === id);
  cart.push(item);
  document.getElementById("cartCount").textContent = cart.length;
}

// ===========================
// 搜尋功能（新 navbar）
// ===========================
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");

if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", () => {
    const kw = searchInput.value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(kw));
    renderProducts(filtered);
  });
}

// ===========================
// 購物車彈窗
// ===========================
const cartIcon = document.getElementById("cart");
if (cartIcon) {
  cartIcon.addEventListener("click", () => {
    if (cart.length === 0) return alert("購物車是空的！");
    const modal = document.getElementById("checkoutModal");
    const list = cart.map(i => i.name).join("、");
    document.getElementById("orderItems").textContent = "商品：" + list;
    modal.classList.remove("hidden");
  });
}

// 下單
document.getElementById("confirmOrder").addEventListener("click", () => {
  alert("下單成功！感謝您的購買。");
  cart = [];
  document.getElementById("cartCount").textContent = 0;
  document.getElementById("checkoutModal").classList.add("hidden");
});

// 關閉 modal
document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("checkoutModal").classList.add("hidden");
});

// 初始渲染
renderProducts(products);

