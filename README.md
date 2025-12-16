# ️ Second Hand – 線上二手交易平台

完整的前後端整合系統｜支援 **買家 / 賣家 / 管理員** 三種角色  
技術棧：**Node.js + Express + MySQL + Docker + 原生 HTML / CSS / JS**

> 系統需求、架構與類別圖詳見課堂的《軟體工程 – 線上二手交易商品交易平台系統分析設計》文件（本 repo 對應之實作專案）。:contentReference[oaicite:0]{index=0}  

---

## 🌟 專案簡介

本專案為「線上二手商品交易平台」，提供以下三種角色使用：

- **買家（Buyer）**
  - 瀏覽與搜尋商品
  - 查看商品詳情、評價
  - 建立訂單、追蹤訂單狀態
  - 檢舉問題商品

- **賣家（Seller）**
  - 上架商品、編輯、下架
  - 查看與管理訂單（確認 / 取消）
  - 回覆買家訊息（介面預留）

- **管理員（Admin）**
  - 後台登入
  - 觀看使用者清單、管理權限
  - 審查檢舉 / 管理商品
  - 平台公告與系統維護（介面與 API 架構預留）

後端採用 **Node.js + Express + MySQL**，  
前端為 **純 HTML / CSS / JS**，並放在 `backend/public`。  
內建 **Swagger UI** 可瀏覽與測試 API。

---

## 🧱 專案結構

```text
second_hand_project_ubuntu/
├── backend/
│   ├── server.js          # 主後端程式（Express）
│   ├── routes/            # 路由：users / products / orders / reports / auth ...（依實作而定）
│   ├── models/            # DB 相關邏輯（含 detectUserColumns 等輔助）
│   ├── public/            # 靜態前端頁面
│   │   ├── login/         # 登入頁面
│   │   ├── sign/          # 註冊頁
│   │   ├── buyer/         # 買家首頁、訂單追蹤等
│   │   ├── seller/        # 賣家商品管理、訂單管理
│   │   └── admin/         # 管理員後台（使用者、檢舉、公告）
│   ├── swagger/           # OpenAPI 定義（若有獨立檔案）
│   ├── Dockerfile         # 後端容器設定（可選）
│   ├── package.json
│   └── ...
├── db/                    # SQL schema / 匯出資料（如有）
├── docker-compose.yaml    # MySQL + phpMyAdmin（之後可擴充 backend service）
├── package-lock.json
└── README.md
````

---

## ✅ 目前已完成功能整理

### 1. 認證 / 使用者系統

* 管理員登入（/admin/login）
* 買家登入（/buyer/login）
* 賣家登入（/seller/login）
* 註冊帳號（目前採 **localStorage 模擬** 前端帳號，方便 demo）
* **動態欄位偵測**：自動讀取 MySQL 的使用者欄位結構（後端 `detectUserColumns`）

> 正式接 DB 的登入 / 權限控管邏輯，可逐步將 localStorage 替換為真實 JWT / Session。

---

### 2. 買家端（Buyer）

* 商品瀏覽、分類與詳細資訊
* 查看商品評價
* 建立訂單（前端 demo 流程）
* 訂單狀態標示（例如：待確認、已接受、已完成…）
* 檢舉商品（送交後端 /admin 審查）

---

### 3. 賣家端（Seller）

* 刊登商品

  * 填寫商品資訊
  * 上傳圖片（前端流程）
  * 設定商品狀態（待售 / 已售 / 下架）
* 編輯 / 刪除已上架商品
* 查看收到的訂單列表

  * 確認或取消訂單
  * 供期末展示用的「訂單追蹤」流程串接

---

### 4. 管理員後台（Admin）

* 使用者列表（檢視所有 user，支援查詢 / 編輯 / 刪除）
* 檢舉管理（reports）

  * 查看檢舉中的商品 / 使用者
  * 狀態管理：pending / reviewed / resolved
  * 支援 PATCH / DELETE 等基本管理 API
* 商品 / 訂單監控（依目前路由進度）
* 平台公告 / 系統設定（畫面與接口預留，可逐步擴充）

---

### 5. API 文件（Swagger）

後端啟動後，可透過 Swagger 查看所有已實作的 API：

* Swagger UI：[http://localhost:3000/docs](http://localhost:3000/docs)
* OpenAPI JSON：[http://localhost:3000/openapi.json](http://localhost:3000/openapi.json)

（網址以 `server.js` 內實際設定為準）

---

## 💻 開發環境需求

| 技術                | 版本建議     |
| ----------------- | -------- |
| Node.js           | 18+      |
| MySQL / MariaDB   | 任意相容版本   |
| Docker（選用）        | 20+      |
| Postman / Swagger | API 測試工具 |

> 若只需要前端 demo（不連資料庫），只要 Node.js 即可。

---

## 🚀 啟動方式一：只跑前端 Demo（無 DB）

**用途：** 給前端 / UI 組員本機開畫面，不需要 VACS、不需要 MySQL。

1. 安裝 Node.js
   下載安裝：[https://nodejs.org/](https://nodejs.org/)

2. 在終端機啟動後端靜態伺服器

   ```bash
   cd backend
   npm install      # 第一次才需要
   node server.js
   ```

   成功會看到：

   ```bash
   Backend running on :3000
   ```

3. 開啟各角色頁面

| 角色   | URL                                                                                |
| ---- | ---------------------------------------------------------------------------------- |
| 登入入口 | [http://localhost:3000/login/login.html](http://localhost:3000/login/login.html)   |
| 註冊   | [http://localhost:3000/sign/sign.html](http://localhost:3000/sign/sign.html)       |
| 買家   | [http://localhost:3000/buyer/buyer.html](http://localhost:3000/buyer/buyer.html)   |
| 賣家   | [http://localhost:3000/seller/index.html](http://localhost:3000/seller/index.html) |
| 管理員  | [http://localhost:3000/admin/index.html](http://localhost:3000/admin/index.html)   |

⚠ **請務必使用 `http://localhost:3000` 開啟，不要直接用 `file://` 打 HTML，會因為沒有經過 Express 而壞掉。

---

## 🐳 啟動方式二：使用 Docker（含 MySQL + phpMyAdmin）

**用途：** 在自己電腦上建立完整的 DB 環境，搭配 backend 開發 / 測試。

1. 安裝 Docker Desktop（或其他 Docker 環境）

2. 在專案根目錄執行：

   ```bash
   docker compose up -d
   ```

   典型會拉起：

   * `secondhand-mysql`：MySQL 資料庫
   * `secondhand-phpmyadmin`：phpMyAdmin 管理介面（例如對外 8081 port）

3. 透過瀏覽器開啟 phpMyAdmin（以你的 `docker-compose.yaml` port 為準）：

   ```text
   http://localhost:8081
   ```

4. 再依「啟動方式一」啟動 backend 的 `server.js`，
   並將後端的 DB 連線設定指向 `secondhand-mysql`（host、帳密、database 名依 compose 設定）。

> 目前 docker-compose 主要管理 DB，之後若需要也可以將 backend 包成獨立 service 一起啟動。

---

## 🧩 前端新增頁面說明

所有前端頁面統一放在：

```text
backend/public/
```

例如新增一個聊天室頁面：

```text
backend/public/chat/
 ├── chat.html
 ├── chat.js
 └── style.css
```

新增後即可直接透過：

```text
http://localhost:3000/chat/chat.html
```

開啟頁面，**不需要改 server.js，不需要額外加路由。**

---

## ⚠ 開發注意事項（組內約定）

1. **前端頁面一律放 `backend/public` 底下**

   * Express 已設定靜態檔案目錄，HTML / CSS / JS 會自動被服務。

2. **所有連結請用「絕對路徑」**

   ✅ 正確寫法：

   ```html
   <a href="/buyer/buyer.html">
   ```

   ❌ 錯誤寫法（容易變成 `Cannot GET`）：

   ```html
   <a href="buyer.html">
   <a href="../buyer/buyer.html">
   ```

3. **目前登入邏輯為 localStorage（前端 demo 用）**

   * 註冊 → 將帳號寫入 localStorage
   * 登入 → 從 localStorage 讀取
   * 換瀏覽器或重裝 → 資料消失是正常現象

   後續可逐步改為：

   * 前端呼叫後端 API（JWT / Session）
   * 真實的 DB 使用者表格作驗證

4. **後端與 DB 串接**

   * 若要修改真實後端 API 或資料表結構，請先確認：

     * `backend/models/` 內是否有對應修改
     * Swagger 文件是否需同步更新
   * 組內建議：由負責後端的人先開 issue / note，再調整程式碼，避免大家的 branch 打架。

5. **常見錯誤小抄**

| 問題                    | 可能原因                      | 解法                           |
| --------------------- | ------------------------- | ---------------------------- |
| `Cannot GET /xxx`     | 使用相對路徑或少了 `.html`         | 改用 `/xxx/xxx.html` 絕對路徑      |
| `sign.html` 打不開       | 靜態路由 / 檔名錯誤               | 檢查 `backend/public/sign` 路徑  |
| 登入按鈕沒反應               | localStorage 清掉 / key 不一致 | 清除並重新註冊                      |
| 直接開 `file://xxx.html` | 沒經過 Express               | 一律使用 `http://localhost:3000` |

---

## 👥 Maintainers

| 學號        | 姓名  |
| --------- | --- |
| S12350106 | 彭竩真 |
| S12350206 | 范薏軒 |
| S12350208 | 葉又嘉 |
| S12350306 | 陳育慈 |
| S12350320 | 吳芊芊 |

---
