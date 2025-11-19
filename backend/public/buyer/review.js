// 讀取 URL 帶進來的 orderId
const urlParams = new URLSearchParams(window.location.search);
const currentOrderId = urlParams.get("orderId");

// 星星評分
let rating = 0;
const starGroup = document.getElementById("starGroup");

// ★★★★★ → 5 個 span
let starHTML = "";
for (let i = 1; i <= 5; i++) {
  starHTML += `<span data-score="${i}">★</span>`;
}
starGroup.innerHTML = starHTML;

const stars = starGroup.querySelectorAll("span");

stars.forEach((star) => {
  star.addEventListener("click", () => {
    rating = star.dataset.score;

    stars.forEach((s) => s.classList.remove("active"));
    for (let i = 0; i < rating; i++) {
      stars[i].classList.add("active");
    }
  });
});

// 載入訂單資料顯示商品名稱
window.onload = () => {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const order = orders.find((o) => o.id == currentOrderId);

  if (order) {
    document.getElementById("productName").textContent =
      `商品：${order.items[0].name}`;
  }
};

// 提交評價
document.getElementById("submitReview").addEventListener("click", () => {
  const comment = document.getElementById("comment").value.trim();

  if (rating === 0) {
    alert("請選擇星星評分！");
    return;
  }

  if (comment === "") {
    alert("請輸入評論內容！");
    return;
  }

  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const order = orders.find((o) => o.id == currentOrderId);

  const review = {
    id: Date.now(),
    orderId: currentOrderId,
    buyer: "Buyer A", // 可動態設定
    seller: order.items[0].seller || "SELLER",
    product: order.items[0].name,
    rating: rating,
    comment: comment,
    reply: "",
    date: new Date().toLocaleString()
  };

  // 保存評論
  const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
  reviews.push(review);
  localStorage.setItem("reviews", JSON.stringify(reviews));

  alert("📝 評價已送出！");
  window.location.href = "orders.html";
});
