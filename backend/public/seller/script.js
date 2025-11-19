let products = [];

document.getElementById("addForm").addEventListener("submit", function(e){
  e.preventDefault();
  
  const name = document.getElementById("name").value.trim();
  const price = document.getElementById("price").value.trim();
  const desc = document.getElementById("desc").value.trim();
  
  if (!name || !price || !desc) {
    alert("⚠️ 請填寫完整的商品資料！");
    return;
  }

  const newProduct = { name, price, desc };
  products.push(newProduct);

  document.getElementById("addForm").reset();
  renderTable();
  alert("✅ 商品刊登成功！");
});

function renderTable() {
  const tbody = document.querySelector("#productTable tbody");
  tbody.innerHTML = "";

  products.forEach((p, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.name}</td>
      <td>${p.price}</td>
      <td>${p.desc}</td>
      <td>
        <button onclick="editProduct(${index})">編輯</button>
        <button onclick="deleteProduct(${index})">刪除</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function editProduct(index) {
  const p = products[index];
  const newName = prompt("修改商品名稱：", p.name);
  const newPrice = prompt("修改價格：", p.price);
  const newDesc = prompt("修改描述：", p.desc);

  if (newName && newPrice && newDesc) {
    products[index] = { name: newName, price: newPrice, desc: newDesc };
    renderTable();
  }
}

function deleteProduct(index) {
  if (confirm("確定要刪除這項商品嗎？")) {
    products.splice(index, 1);
    renderTable();
  }
}
// ===== 登出按鈕功能 =====
document.querySelector(".logout-btn").addEventListener("click", function() {
  if (confirm("確定要登出嗎？")) {
    alert("✅ 已成功登出，將返回登入頁面");
    // 模擬返回登入頁（這裡可以改成你真正的登入頁網址）
    window.location.href = "login.html";

  }
});

