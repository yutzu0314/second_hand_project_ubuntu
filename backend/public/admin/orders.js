// backend/public/admin/orders.js

const API_BASE = "";

// ========== DOM ==========
const tbody = document.getElementById("orderTableBody");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchInput");
const filterBtn = document.getElementById("filterBtn");

let allOrders = [];

// ========== 叫後端拿訂單 ==========
async function fetchOrders() {
    try {
        const status = statusFilter.value;
        const params = new URLSearchParams();
        if (status) params.append("status", status);

        const res = await fetch(`${API_BASE}/api/order/list?` + params.toString());
        if (!res.ok) {
            throw new Error("載入訂單失敗");
        }
        const data = await res.json(); // { total, items }
        allOrders = data.items || [];
        renderOrders(allOrders);
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7">載入訂單失敗，請稍後再試</td></tr>`;
    }
}

// ========== 畫表格 ==========
function renderOrders(list) {
    tbody.innerHTML = "";

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7">目前沒有符合條件的訂單</td></tr>`;
        return;
    }

    for (const o of list) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${o.order_id}</td>
            <td>${o.product_title}</td>
            <td>NT$${o.order_price}</td>
            <td>${o.buyer_name}（ID: ${o.buyer_id}）</td>
            <td>${o.seller_name}（ID: ${o.seller_id}）</td>
            <td>${o.status}</td>
            <td>${o.created_at || ""}</td>
            <td>
                <button class="btn small" data-id="${o.order_id}" data-action="view">查看</button>
            </td>
            `;

        tbody.appendChild(tr);
    }
}

// ========== 搜尋（前端 filter） ==========
function applyFilter() {
    const keyword = searchInput.value.trim().toLowerCase();

    if (!keyword) {
        renderOrders(allOrders);
        return;
    }

    const filtered = allOrders.filter((o) => {
        return (
            (o.product_title || "").toLowerCase().includes(keyword) ||
            String(o.buyer_id).includes(keyword) ||
            String(o.seller_id).includes(keyword)
        );
    });

    renderOrders(filtered);
}

// 事件
filterBtn.addEventListener("click", applyFilter);
statusFilter.addEventListener("change", fetchOrders);

// 一載入頁面就打 API
document.addEventListener("DOMContentLoaded", fetchOrders);
document.addEventListener("click", (e) => {
    if (e.target.matches("button[data-action='view']")) {
        const id = Number(e.target.dataset.id);
        const order = allOrders.find(o => o.order_id === id);
        if (!order) return;

        // 先用 alert／console，看你們需求再做 modal
        alert(
            `訂單 #${order.order_id}\n` +
            `商品：${order.product_title}\n` +
            `金額：NT$${order.order_price}\n` +
            `買家：${order.buyer_name}（ID:${order.buyer_id}）\n` +
            `賣家：${order.seller_name}（ID:${order.seller_id}）\n` +
            `狀態：${order.status}\n` +
            `建立時間：${order.created_at || ""}`
        );
    }
});
