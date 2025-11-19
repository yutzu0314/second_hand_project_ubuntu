---

# 🛍️ Second Hand – 二手交易平台

完整的前後端整合系統｜支援買家 / 賣家 / 管理員多角色
（Node.js + Express + MySQL + Docker）

---

## 📌 專案簡介

此專案為一個 **二手商品交易平台**，提供三種角色使用：

* 🛒 **買家**：瀏覽商品、下單、檢舉商品、查看評價
* 🧾 **賣家**：上架商品、管理訂單、編輯、刪除商品
* 🔧 **管理員**：後台登入、查看使用者、審查檢舉、管理商品

後端採用 **Node.js + Express + MySQL**，
前端使用 **純 HTML / CSS / JS** 放置於 `backend/public` 內。
內建 **Swagger UI** 可瀏覽所有 API。

---

## 🧱 系統架構

```
backend
 ├── server.js           # 主後端程式
 ├── public/             # 靜態前端頁面（不用 Nginx / React）
 │    ├── login/         # 登入介面
 │    ├── buyer/         # 買家前端
 │    ├── seller/        # 賣家前端
 │    ├── admin/         # 管理員後台
 │    └── sign/          # 註冊頁
 ├── db/                 # SQL 或資料庫相關文件（如有）
 ├── Dockerfile
 ├── package.json
```

---

## ✨ 已完成功能

### 🔑 認證 / 使用者系統

* 管理員登入（/admin/login）
* 買家登入（/buyer/login）
* 賣家登入（/seller/login）
* 註冊帳號（localStorage 模擬）
* 動態欄位偵測（自動讀取 MySQL 的欄位結構）

### 🛒 買家端

* 商品瀏覽、詳細資訊
* 評價查看
* 商品檢舉
* 前端 demo 訂單流程

### 🧾 賣家端

* 商品上架
* 訂單管理
* 商品編輯 / 刪除

### 🛠 管理員後台

* 使用者清單
* 檢舉列表（pending / reviewed / resolved）
* 修改使用者資料（PATCH）
* 刪除使用者（DELETE）

### 🧪 API 文件

Swagger 已整合：
👉 [http://localhost:3000/docs](http://localhost:3000/docs)
👉 [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json)

---

## 🛠 開發環境需求

| 技術                | 版本     |
| ----------------- | ------ |
| Node.js           | 18+    |
| MySQL / MariaDB   | 任意版本   |
| Docker（選用）        | 20+    |
| Postman / Swagger | API 測試 |

---

## 🚀 本地啟動方式（不使用 Docker）

前端同學只需進入 backend 跑 server.js，即可所有頁面正常讀取。
不需資料庫、不需 VACS 連線。

---

### 1️⃣ 安裝 Node.js

下載安裝即可：
[https://nodejs.org/](https://nodejs.org/)

---

### 2️⃣ 在終端機啟動專案

```
cd backend
npm install      # 第一次執行才需要
node server.js
```

成功會看到：

```
Backend running on :3000
```

---

### 3️⃣ 開啟前端頁面

| URL                                                                                | 角色   |
| ---------------------------------------------------------------------------------- | ---- |
| [http://localhost:3000/login/login.html](http://localhost:3000/login/login.html)   | 登入入口 |
| [http://localhost:3000/sign/sign.html](http://localhost:3000/sign/sign.html)       | 註冊   |
| [http://localhost:3000/buyer/buyer.html](http://localhost:3000/buyer/buyer.html)   | 買家   |
| [http://localhost:3000/seller/index.html](http://localhost:3000/seller/index.html) | 賣家   |
| [http://localhost:3000/admin/index.html](http://localhost:3000/admin/index.html)   | 管理員  |

⚠ **請使用 [http://localhost:3000，不要直接用](http://localhost:3000，不要直接用) file:// 方式開 HTML（會壞掉）。**

---

## ✏️ 前端如何新增頁面？

所有前端都放在：

```
backend/public/
```

例如新增聊天室頁：

```
backend/public/chat/
 ├── chat.html
 ├── chat.js
 └── style.css
```

Express 會自動提供靜態檔案 →
可直接瀏覽：

```
http://localhost:3000/chat/chat.html
```

🔔 **不需要修改 server.js、不需要新增後端路由。**

---

## 🔌 API 文件（Swagger）

後端啟動後就能開啟：

👉 [http://localhost:3000/docs](http://localhost:3000/docs)
👉 [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json)

---

## 🔧 開發注意事項（請所有組員務必閱讀）

### 📁 1. 前端頁面要放在 backend/public 底下

Express 已幫你設定靜態檔，因此所有 HTML / CSS / JS 都能直接瀏覽。

---

### 🔗 2. 路徑請一定要用「絕對路徑」

✔ 正確寫法：

```html
<a href="/buyer/buyer.html">
```

❌ 錯誤寫法（會變 Cannot GET）：

```html
<a href="buyer.html">
<a href="../buyer/buyer.html">
```

---

### 🧪 3. 前端登入機制為 localStorage（測試用）

* 註冊 → 存入 localStorage
* 登入 → 讀取 localStorage
* 重開瀏覽器、換機器 → 資料會消失（正常現象）

後端正式登入（API）則由育慈維護於學校 VACS，不在本機。

---

### 🏫 4. 後端（真正的 SQL + API）部署在 VACS

前端組員不需要接觸 VACS 或 MySQL。
若要修改後端功能請先聯絡後端成員。

---

### 🛑 5. 常見錯誤整理

| 問題                   | 原因                   | 解法                                                 |
| -------------------- | -------------------- | -------------------------------------------------- |
| Cannot GET /xxx      | 用相對路徑                | 改為 `/xxx/xxx.html`                                 |
| Sign.html 打不開        | 靜態路由未正確設定（已修復）       | 重跑 server.js                                       |
| 登入沒反應                | localStorage 清掉或換瀏覽器 | 重註冊即可                                              |
| 打開 file://login.html | 沒經過 Express          | 一律用 [http://localhost:3000](http://localhost:3000) |

---

## 🤝 Maintainers

| 學號        | 姓名  |
| --------- | --- |
| S12350106 | 彭竩真 |
| S12350206 | 范薏軒 |
| S12350306 | 陳育慈 |
| S12350320 | 吳芊芊 |

---
