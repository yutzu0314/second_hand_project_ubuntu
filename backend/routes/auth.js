// routes/auth.js
import { Router } from 'express';
import pool from '../db.js';
import { simpleLogin, getUserColumns } from '../models/users.js';

const router = Router();


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

router.post('/admin/login', async (req, res) => {
    try {
        const { EMAIL_COL, NAME_COL, ID_COL, PASS_COL, ROLE_COL, STATUS_COL } = getUserColumns();
        const { name, email, password } = req.body || {};

        if ((!name && !email) || !password) {
            return res.status(400).json({ error: '缺少 name/email 或 password' });
        }

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

router.post('/buyer/login', (req, res) => simpleLogin(req, res, 'buyer'));

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

router.post('/seller/login', (req, res) => simpleLogin(req, res, 'seller'));

export default router;
