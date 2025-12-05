// routes/users.js
import { Router } from 'express';
import pool from '../db.js';
import { getUserColumns } from '../models/users.js';

const router = Router();

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
 */
router.get('/api/users', async (_req, res) => {
    try {
        const { ID_COL, NAME_COL, EMAIL_COL, ROLE_COL, STATUS_COL, CREATED_COL } = getUserColumns();

        const sql = `
      SELECT
        \`${ID_COL}\` AS id,
        ${EMAIL_COL ? `\`${EMAIL_COL}\` AS email` : `NULL AS email`}
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

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: 新增使用者
 *     tags:
 *       - Users
 */
router.post('/api/users', async (req, res) => {
    try {
        const { email, password, role = 'buyer', status = 'active', name = null } = req.body || {};
        if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

        const { PASS_COL, NAME_COL, ROLE_COL, STATUS_COL, EMAIL_COL } = getUserColumns();

        if (!EMAIL_COL) {
            return res.status(500).json({ error: 'users 表沒有 email 欄位' });
        }

        const fields = [EMAIL_COL, PASS_COL];
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

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     summary: 更新使用者資料
 *     tags:
 *       - Users
 */
router.patch('/api/users/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, role, status } = req.body || {};
        if (!id) return res.status(400).json({ error: 'Bad id' });

        const { ID_COL, NAME_COL, ROLE_COL, STATUS_COL } = getUserColumns();

        const sets = [], vals = [];
        if (typeof name !== 'undefined' && name !== null && NAME_COL) {
            sets.push(`\`${NAME_COL}\` = ?`);
            vals.push(name);
        }
        if (typeof role !== 'undefined' && role !== null && ROLE_COL) {
            sets.push(`\`${ROLE_COL}\` = ?`);
            vals.push(role);
        }
        if (typeof status !== 'undefined' && status !== null && STATUS_COL) {
            sets.push(`\`${STATUS_COL}\` = ?`);
            vals.push(status);
        }

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

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: 刪除使用者
 *     tags:
 *       - Users
 */
router.delete('/api/users/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ error: 'Bad id' });

        const { ID_COL } = getUserColumns();

        await pool.query(`DELETE FROM users WHERE \`${ID_COL}\` = ?`, [id]);
        res.json({ ok: true });
    } catch (e) {
        console.error('DELETE /api/users/:id', e);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @openapi
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: 重設使用者密碼
 *     tags:
 *       - Users
 */
router.post('/api/users/:id/reset-password', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { password } = req.body || {};
        if (!id || !password) return res.status(400).json({ error: 'Missing id or password' });

        const { ID_COL, PASS_COL } = getUserColumns();

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

export default router;
