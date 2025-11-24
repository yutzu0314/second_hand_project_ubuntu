// -------------------- Imports --------------------
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import pool from './db.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------- Swagger 設定 --------------------
const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SecondHand - API',
            version: '0.1.0',
            description: '二手交易平台 API 文件',
        },
        servers: [{ url: 'http://localhost:3000' }],
    },
    apis: [path.join(__dirname, 'server.js')],
});

// -------------------- 建立 Express App --------------------
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// -------------------- 掛載 Swagger UI --------------------
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/openapi.json', (_req, res) => res.json(swaggerSpec));

// -------------------- 靜態頁 --------------------
app.use('/login', express.static(path.join(__dirname, 'public/login')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.use('/buyer', express.static(path.join(__dirname, 'public/buyer')));
app.use('/seller', express.static(path.join(__dirname, 'public/seller')));
app.use('/sign', express.static(path.join(__dirname, 'public/sign')));
app.get('/login', (req, res) => res.redirect('/login/login.html'));


// -------------------- 動態偵測欄位 --------------------
let ID_COL = 'id';
let PASS_COL = 'password';          // 若只有 password_hash 也會自動切過去
let NAME_COL = 'name';
let EMAIL_COL = 'email';
let ROLE_COL = 'role';
let STATUS_COL = null;              // 有就用，沒有就當 active
let CREATED_COL = 'created_at';

async function detectUserColumns() {
    const [cols] = await pool.query('SHOW COLUMNS FROM users');
    const set = new Set(cols.map(c => c.Field));

    ID_COL = set.has('user_id') ? 'user_id' : (set.has('id') ? 'id' : 'id');
    PASS_COL = set.has('password') ? 'password' : (set.has('password_hash') ? 'password_hash' : 'password');
    NAME_COL = set.has('name') ? 'name' : (set.has('username') ? 'username' : null);
    ROLE_COL = set.has('role') ? 'role' : null;
    STATUS_COL = set.has('status') ? 'status' : null;
    CREATED_COL = set.has('created_at') ? 'created_at' : (set.has('create_time') ? 'create_time' : null);
    EMAIL_COL = set.has('email') ? 'email' : null;

    console.log('[users columns]',
        { ID_COL, PASS_COL, NAME_COL, ROLE_COL, STATUS_COL, CREATED_COL, EMAIL_COL });
}

// 啟動前偵測一次
await detectUserColumns();

// -------------------- API：明碼登入（先跑通） --------------------

/**
 * @openapi
 * /admin/login:
 *   post:
 *     summary: 管理員登入（支援 name 或 email）
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: 管理員名稱（對應 users.name）
 *                 example: admin001
 *               email:
 *                 type: string
 *                 description: 管理員 Email（對應 users.email）
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 description: 使用者密碼
 *                 example: 123456
 *           examples:
 *             loginByName:
 *               summary: 使用 name 登入
 *               value:
 *                 name: admin001
 *                 password: "123456"
 *             loginByEmail:
 *               summary: 使用 email 登入
 *               value:
 *                 email: admin@example.com
 *                 password: "123456"
 *     responses:
 *       200:
 *         description: 登入成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 id:
 *                   type: integer
 *                 role:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *       400:
 *         description: 缺少 name/email 或 password
 *       401:
 *         description: 帳號不存在或密碼錯誤
 *       403:
 *         description: 帳號未啟用或無後台權限
 */

app.post('/admin/login', async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        if ((!name && !email) || !password) {
            return res.status(400).json({ error: '缺少 name/email 或 password' });
        }

        const keyField = email ? EMAIL_COL : NAME_COL;
        const keyValue = email || name;

        const sql = `
      SELECT
        \`${ID_COL}\` AS id,
        ${EMAIL_COL ? `\`${EMAIL_COL}\` AS email,` : `'N/A' AS email,`}
        ${NAME_COL ? `\`${NAME_COL}\` AS name,` : `'N/A' AS name,`}
        \`${PASS_COL}\` AS pwd
        ${ROLE_COL ? `, \`${ROLE_COL}\` AS role` : `, 'admin' AS role`}
        ${STATUS_COL ? `, \`${STATUS_COL}\` AS status` : `, 'active' AS status`}
      FROM users
      WHERE \`${keyField}\` = ?
      LIMIT 1
    `;

        const [rows] = await pool.query(sql, [keyValue]);
        const u = rows[0];

        if (!u) return res.status(401).json({ error: '帳號不存在' });
        if (u.pwd !== password) return res.status(401).json({ error: '密碼錯誤' });
        if (u.status !== 'active') return res.status(403).json({ error: '帳號未啟用或已停用' });

        // 限制必須是 admin / superadmin
        if (ROLE_COL && !['admin', 'superadmin'].includes(u.role)) {
            return res.status(403).json({ error: '沒有後台管理權限' });
        }

        res.json({
            token: 'DEV_TOKEN',
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role
        });

    } catch (e) {
        console.error('POST /admin/login', e);
        res.status(500).json({ error: 'Server error' });
    }
});


// 共用：一般登入檢查（支援 name 或 email，不用 user_id）
async function simpleLogin(req, res, roleWanted) {
    const { name, email, password } = req.body || {};

    // 至少要有 name 或 email + password
    if ((!name && !email) || !password) {
        return res.status(400).json({ error: '缺少 name/email 或 password' });
    }

    // ✅ 用 name 或 email 查（兩者都給就 email 優先）
    const keyField = email ? EMAIL_COL : NAME_COL;
    const keyValue = email || name;

    if (!keyField) {
        return res.status(500).json({ error: 'users 表沒有 name 或 email 欄位' });
    }

    const sql = `
    SELECT 
      \`${ID_COL}\` AS id,
      ${EMAIL_COL ? `\`${EMAIL_COL}\` AS email,` : `'N/A' AS email,`}
      ${NAME_COL ? `\`${NAME_COL}\` AS name,` : `'N/A' AS name,`}
      \`${PASS_COL}\` AS pwd
      ${ROLE_COL ? `, \`${ROLE_COL}\` AS role` : `, '${roleWanted || 'buyer'}' AS role`}
      ${STATUS_COL ? `, \`${STATUS_COL}\` AS status` : `, 'active' AS status`}
    FROM users
    WHERE \`${keyField}\` = ?
    LIMIT 1
  `;

    const [rows] = await pool.query(sql, [keyValue]);
    const u = rows[0];

    if (!u) return res.status(401).json({ error: '帳號不存在' });
    if (u.pwd !== password) return res.status(401).json({ error: '密碼錯誤' });
    if (u.status !== 'active') return res.status(403).json({ error: '帳號未啟用或已停用' });

    if (roleWanted && ROLE_COL && u.role !== roleWanted) {
        return res.status(403).json({ error: `需要 ${roleWanted} 身分` });
    }

    return res.json({
        success: true,
        token: 'DEV_TOKEN',
        id: u.id,
        role: u.role,
        email: u.email,
        name: u.name
    });
}


/**
 * @openapi
 * /buyer/login:
 *   post:
 *     summary: 買家登入（支援 name 或 email）
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: 使用者名稱（與 users.name 對應）
 *                 example: user1
 *               email:
 *                 type: string
 *                 description: Email（與 users.email 對應）
 *                 example: user1@example.com
 *               password:
 *                 type: string
 *                 example: 0000
 *           examples:
 *             loginByName:
 *               summary: 用 name 登入
 *               value: { name: "user1", password: "0000" }
 *             loginByEmail:
 *               summary: 用 email 登入
 *               value: { email: "user1@example.com", password: "0000" }
 *     responses:
 *       200:
 *         description: 登入成功
 *       400:
 *         description: 缺少 name/email 或 password
 *       401:
 *         description: 帳號不存在或密碼錯誤
 *       403:
 *         description: 帳號未啟用或非 buyer 身分
 */

app.post('/buyer/login', (req, res) => simpleLogin(req, res, 'buyer'));

/**
 * @openapi
 * /seller/login:
 *   post:
 *     summary: 賣家登入（支援 name 或 email）
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: 使用者名稱（與 users.name 對應）
 *                 example: user2
 *               email:
 *                 type: string
 *                 description: Email（與 users.email 對應）
 *                 example: user2@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *           examples:
 *             loginByName:
 *               summary: 用 name 登入
 *               value: { name: "user2", password: "123456" }
 *             loginByEmail:
 *               summary: 用 email 登入
 *               value: { email: "user2@example.com", password: "123456" }
 *     responses:
 *       200:
 *         description: 登入成功
 *       400:
 *         description: 缺少 name/email 或 password
 *       401:
 *         description: 帳號不存在或密碼錯誤
 *       403:
 *         description: 帳號未啟用或非 seller 身分
 */

app.post('/seller/login', (req, res) => simpleLogin(req, res, 'seller'));


// -------------------- API：使用者列表 --------------------

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: 取得使用者列表
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: 使用者清單
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *                     nullable: true
 *                   role:
 *                     type: string
 *                     nullable: true
 *                   status:
 *                     type: string
 *                     nullable: true
 */

app.get('/api/users', async (_req, res) => {
    try {
        const sql = `
            SELECT
            \`${ID_COL}\` AS id,
            email
            ${NAME_COL ? `, \`${NAME_COL}\` AS name` : `, NULL AS name`}
            ${ROLE_COL ? `, \`${ROLE_COL}\` AS role` : `, NULL AS role`}
            ${STATUS_COL ? `, \`${STATUS_COL}\` AS status` : `, NULL AS status`}
            ${CREATED_COL ? `, \`${CREATED_COL}\` AS created_at` : `, NULL AS created_at`}
            FROM users
            ORDER BY \`${ID_COL}\` DESC
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (e) {
        console.error('GET /api/users', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// -------------------- API：新增使用者（先明碼寫入） --------------------

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: 新增使用者
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               name:
 *                 type: string
 *                 example: 小明
 *               role:
 *                 type: string
 *                 description: 使用者角色（buyer / seller / admin）
 *                 example: buyer
 *               status:
 *                 type: string
 *                 description: 帳號狀態（active / banned）
 *                 example: active
 *     responses:
 *       201:
 *         description: 建立成功
 *       400:
 *         description: 缺少 email 或 password
 *       409:
 *         description: Email 已存在
 */

app.post('/api/users', async (req, res) => {
    try {
        const { email, password, role = 'buyer', status = 'active', name = null } = req.body || {};
        if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

        // 組動態欄位清單
        const fields = ['email', PASS_COL];
        const vals = [email, password];

        if (NAME_COL) { fields.push(NAME_COL); vals.push(name); }
        if (ROLE_COL) { fields.push(ROLE_COL); vals.push(role); }
        if (STATUS_COL) { fields.push(STATUS_COL); vals.push(status); }

        const placeholders = fields.map(() => '?').join(',');
        const sql = `INSERT INTO users (${fields.map(f => `\`${f}\``).join(',')}) VALUES (${placeholders})`;

        await pool.query(sql, vals);
        res.status(201).json({ ok: true });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email exists' });
        console.error('POST /api/users', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// 取得檢舉清單（預設 pending）

/**
 * @openapi
 * /api/reports:
 *   get:
 *     summary: 取得檢舉清單
 *     tags:
 *       - Reports
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           default: pending
 *           example: pending
 *         description: 檢舉狀態（pending / reviewed / resolved）
 *     responses:
 *       200:
 *         description: 檢舉列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   reporter_id:
 *                     type: integer
 *                   target_type:
 *                     type: string
 *                   target_id:
 *                     type: integer
 *                   reason_code:
 *                     type: string
 *                   reason_text:
 *                     type: string
 *                     nullable: true
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */

app.get('/api/reports', async (req, res) => {
    try {
        const status = (req.query.status || 'pending').toString();
        const [rows] = await pool.query(
            `SELECT
                report_id AS id,
                reporter_id,
                target_type,
                target_id,
                reason_code,
                reason_text,
                status,
                created_at
            FROM
                reports
            WHERE
                status = ?
            ORDER BY
                report_id DESC`,
            [status]
        );
        res.json(rows);
    } catch (e) {
        console.error('GET /api/reports', e);
        res.status(500).json({ error: 'Server error' });
    }
});



// 建立檢舉（給前台使用）

/**
 * @openapi
 * /api/reports:
 *   post:
 *     summary: 建立檢舉
 *     tags:
 *       - Reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reporter_id
 *               - target_type
 *               - target_id
 *               - reason_code
 *             properties:
 *               reporter_id:
 *                 type: integer
 *                 example: 1
 *               target_type:
 *                 type: string
 *                 example: product
 *               target_id:
 *                 type: integer
 *                 example: 10
 *               reason_code:
 *                 type: string
 *                 example: fraud
 *               reason_text:
 *                 type: string
 *                 nullable: true
 *                 example: 賣家疑似詐騙
 *     responses:
 *       201:
 *         description: 檢舉已建立
 *       400:
 *         description: 缺少必要欄位
 */

app.post('/api/reports', async (req, res) => {
    try {
        const { reporter_id, target_type, target_id, reason_code, reason_text } = req.body || {};
        if (!reporter_id || !target_type || !target_id || !reason_code)
            return res.status(400).json({ error: 'Missing fields' });

        const [r] = await pool.query(
            `INSERT INTO
            reports (
                reporter_id,
                target_type,
                target_id,
                reason_code,
                reason_text
            )
            VALUES
                (?, ?, ?, ?, ?)`,
            [reporter_id, target_type, target_id, reason_code, reason_text || null]
        );
        res.status(201).json({ ok: true, id: r.insertId });
    } catch (e) {
        console.error('POST /api/reports', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// 更新檢舉狀態（管理員處理）

/**
 * @openapi
 * /api/reports/{id}:
 *   patch:
 *     summary: 更新檢舉狀態
 *     tags:
 *       - Reports
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 檢舉 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: 新狀態（in_review / resolved / rejected）
 *                 example: resolved
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 缺少 id 或 status
 */

app.patch('/api/reports/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body || {}; // in_review / resolved / rejected
        if (!id || !status) return res.status(400).json({ error: 'Missing id or status' });

        await pool.query(`UPDATE reports SET status=? WHERE report_id=?`, [status, id]);
        res.json({ ok: true });
    } catch (e) {
        console.error('PATCH /api/reports/:id', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// 更新使用者（部分欄位更新：name/role/status）

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     summary: 更新使用者資料
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 使用者 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 新名字
 *               role:
 *                 type: string
 *                 example: seller
 *               status:
 *                 type: string
 *                 example: active
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: id 不合法或沒有可更新欄位
 */

app.patch('/api/users/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, role, status } = req.body || {};
        if (!id) return res.status(400).json({ error: 'Bad id' });

        const sets = [], vals = [];
        if (typeof name !== 'undefined' && name !== null) { sets.push(`${NAME_COL ? `\`${NAME_COL}\`` : 'name'} = ?`); vals.push(name); }
        if (typeof role !== 'undefined' && role !== null && ROLE_COL) { sets.push(`\`${ROLE_COL}\` = ?`); vals.push(role); }
        if (typeof status !== 'undefined' && status !== null && STATUS_COL) { sets.push(`\`${STATUS_COL}\` = ?`); vals.push(status); }

        if (!sets.length) return res.status(400).json({ error: 'No fields' });

        vals.push(id);
        const sql = `UPDATE users SET ${sets.join(', ')} WHERE \`${ID_COL}\` = ?`;
        await pool.query(sql, vals);
        res.json({ ok: true });
    } catch (e) {
        console.error('PATCH /api/users/:id', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// 刪除使用者

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: 刪除使用者
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 使用者 ID
 *     responses:
 *       200:
 *         description: 刪除成功
 *       400:
 *         description: id 不合法
 */

app.delete('/api/users/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ error: 'Bad id' });

        await pool.query(`DELETE FROM users WHERE \`${ID_COL}\` = ?`, [id]);
        res.json({ ok: true });
    } catch (e) {
        console.error('DELETE /api/users/:id', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// 重設密碼

/**
 * @openapi
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: 重設使用者密碼
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 使用者 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: 密碼已更新
 *       400:
 *         description: 缺少 id 或 password
 */

app.post('/api/users/:id/reset-password', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { password } = req.body || {};
        if (!id || !password) return res.status(400).json({ error: 'Missing id or password' });

        // 明碼版（之後改 bcrypt.hash）
        await pool.query(
            `UPDATE users SET \`${PASS_COL}\` = ? WHERE \`${ID_COL}\` = ?`,
            [password, id]
        );
        res.json({ ok: true });
    } catch (e) {
        console.error('POST /api/users/:id/reset-password', e);
        res.status(500).json({ error: 'Server error' });
    }
});



// -------------------- 掛載你的交易/商品 routes --------------------
import ordersRouter from './routes/orders.js';
import productsRouter from './routes/products.js';

app.use('/api/order', ordersRouter);
app.use('/api/products', productsRouter);

// -------------------- 啟動 --------------------
const port = Number(process.env.PORT || 3000);

(async () => {
    await detectUserColumns(); // 先偵測欄位
    app.listen(port, () => console.log('Backend running on :' + port));
})();
