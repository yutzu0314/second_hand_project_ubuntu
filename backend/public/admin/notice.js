// backend/public/admin/notice.js

const API_BASE = "";

// DOM
const tbody = document.getElementById("annTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const filterBtn = document.getElementById("filterBtn");
const btnReload = document.getElementById("btnReload");
const btnNew = document.getElementById("btnNew");

// 編輯區
const annId = document.getElementById("annId");
const annTitle = document.getElementById("annTitle");
const annStatus = document.getElementById("annStatus");
const annFrom = document.getElementById("annFrom");
const annTo = document.getElementById("annTo");
const annContent = document.getElementById("annContent");
const btnSave = document.getElementById("btnSave");
const btnReset = document.getElementById("btnReset");

let allAnnouncements = [];

// 載入列表
async function fetchAnnouncements() {
    try {
        const params = new URLSearchParams();
        const status = statusFilter.value;
        const q = searchInput.value.trim();

        if (status && status !== "all") params.append("status", status);
        if (q) params.append("q", q);

        const res = await fetch(`${API_BASE}/api/announcements?` + params.toString());
        if (!res.ok) throw new Error("載入公告失敗");

        const data = await res.json();
        allAnnouncements = data.items || [];
        renderAnnouncements(allAnnouncements);
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6">載入公告失敗</td></tr>`;
    }
}

function renderAnnouncements(list) {
    tbody.innerHTML = "";
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="6">目前沒有公告</td></tr>`;
        return;
    }

    list.forEach(a => {
        const tr = document.createElement("tr");
        const range = [
            a.visible_from ? a.visible_from : "",
            a.visible_to ? a.visible_to : "",
        ].filter(Boolean).join(" ~ ");

        tr.innerHTML = `
            <td>${a.id}</td>
            <td>${a.title}</td>
            <td>${a.status}</td>
            <td>${range || "（未設定）"}</td>
            <td>${formatDateTime(a.created_at)}</td>
            <td>
                <button class="btn small" data-id="${a.id}" data-action="edit">編輯</button>
                <button class="btn small danger-outline" data-id="${a.id}" data-action="delete">刪除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 把某一筆填進表單
function fillForm(a) {
    annId.value = a.id;
    annTitle.value = a.title || "";
    annStatus.value = a.status || "draft";

    // 從 DB 回來是 "2025-12-10T01:09:47.000Z" 這種，要切成 datetime-local 格式
    annFrom.value = a.visible_from ? a.visible_from.slice(0, 16) : "";
    annTo.value = a.visible_to ? a.visible_to.slice(0, 16) : "";

    annContent.value = a.content || "";
}

// 清表單
function resetForm() {
    annId.value = "";
    annTitle.value = "";
    annStatus.value = "draft";
    annFrom.value = "";
    annTo.value = "";
    annContent.value = "";
}

// 儲存（新增 or 更新）
async function saveAnnouncement() {
    const id = annId.value ? Number(annId.value) : null;
    const payload = {
        title: annTitle.value.trim(),
        content: annContent.value.trim(),
        status: annStatus.value,
        visible_from: annFrom.value || null,
        visible_to: annTo.value || null,
    };

    if (!payload.title || !payload.content) {
        alert("標題與內容不可空白");
        return;
    }

    try {
        let res;
        if (id) {
            res = await fetch(`/api/announcements/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        } else {
            res = await fetch(`/api/announcements`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        }

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "儲存失敗");
            return;
        }

        alert("已儲存公告");
        resetForm();
        fetchAnnouncements();
    } catch (err) {
        console.error(err);
        alert("儲存公告時發生錯誤");
    }
}

// 刪除
async function deleteAnnouncement(id) {
    if (!confirm(`確定要刪除公告 #${id} 嗎？`)) return;
    try {
        const res = await fetch(`/api/announcements/${id}`, {
            method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "刪除失敗");
            return;
        }
        fetchAnnouncements();
    } catch (err) {
        console.error(err);
        alert("刪除時發生錯誤");
    }
}

function formatDateTime(str) {
    if (!str) return "";
    // 例: 2025-12-10T02:14:43.000Z
    // 先去掉毫秒與 Z，再把 T 換成空格
    return str.replace("T", " ").slice(0, 19); // 2025-12-10 02:14:43
}


// 事件繫結
filterBtn.addEventListener("click", fetchAnnouncements);
btnReload.addEventListener("click", fetchAnnouncements);
btnNew.addEventListener("click", resetForm);
btnSave.addEventListener("click", saveAnnouncement);
btnReset.addEventListener("click", resetForm);

document.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    const target = allAnnouncements.find(a => a.id === id);
    if (!target && action !== "delete") return;

    if (action === "edit") {
        fillForm(target);
    } else if (action === "delete") {
        deleteAnnouncement(id);
    }
});

// 初次載入
document.addEventListener("DOMContentLoaded", fetchAnnouncements);
