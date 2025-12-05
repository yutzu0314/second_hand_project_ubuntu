// routes/reports.js
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

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

router.get('/api/reports', async (req, res) => {
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

router.post('/api/reports', async (req, res) => {
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

router.patch('/api/reports/:id', async (req, res) => {
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

export default router;
