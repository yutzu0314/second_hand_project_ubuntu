// backend/routes/announcements.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

function httpError(res, status, message) {
    return res.status(status).json({ error: message });
}

/**
 * GET /api/announcements
 * 管理員用列表：?status=&q=&limit=&offset=
 */
router.get("/api/announcements", async (req, res) => {
    const {
        status,
        q,
        limit = 20,
        offset = 0,
    } = req.query;

    const conds = [];
    const params = [];

    if (status && status !== "all") {
        conds.push("status = ?");
        params.push(status);
    }
    if (q) {
        conds.push("(title LIKE ? OR content LIKE ?)");
        params.push(`%${q}%`, `%${q}%`);
    }

    const whereSql = conds.length ? "WHERE " + conds.join(" AND ") : "";

    try {
        const [rows] = await pool.query(
            `SELECT * FROM announcements
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
            [...params, Number(limit), Number(offset)]
        );

        const [countRows] = await pool.query(
            `SELECT COUNT(*) AS total FROM announcements ${whereSql}`,
            params
        );

        res.json({ total: countRows[0].total, items: rows });
    } catch (err) {
        console.error(err);
        httpError(res, 500, "list_announcements failed");
    }
});

/**
 * GET /api/announcements/public
 * 前台用：只拿已發佈且在時間內的公告
 * 可選 ?limit=
 */
router.get("/api/announcements/public", async (req, res) => {
    const { limit = 5 } = req.query;
    const now = new Date();

    try {
        const [rows] = await pool.query(
            `SELECT id, title, content, visible_from, visible_to, created_at
       FROM announcements
       WHERE status = 'published'
         AND (visible_from IS NULL OR visible_from <= ?)
         AND (visible_to   IS NULL OR visible_to   >= ?)
       ORDER BY visible_from IS NULL DESC, visible_from DESC, id DESC
       LIMIT ?`,
            [now, now, Number(limit)]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        httpError(res, 500, "public_announcements failed");
    }
});

/**
 * GET /api/announcements/:id
 */
router.get("/api/announcements/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return httpError(res, 400, "invalid id");

    try {
        const [rows] = await pool.query(
            "SELECT * FROM announcements WHERE id=?",
            [id]
        );
        if (!rows.length) return httpError(res, 404, "not found");
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        httpError(res, 500, "get_announcement failed");
    }
});

/**
 * POST /api/announcements
 * body: { title, content, status?, visible_from?, visible_to?, created_by? }
 */
router.post("/api/announcements", async (req, res) => {
    let {
        title,
        content,
        status = "draft",
        visible_from = null,
        visible_to = null,
        created_by = null,
    } = req.body;

    if (!title || !content) {
        return httpError(res, 400, "title & content required");
    }

    if (!["draft", "published", "archived"].includes(status)) {
        return httpError(res, 400, "invalid status");
    }

    title = String(title).trim();
    if (!title) return httpError(res, 400, "title cannot be empty");

    try {
        const [ret] = await pool.query(
            `INSERT INTO announcements
       (title, content, status, visible_from, visible_to, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [title, content, status, visible_from, visible_to, created_by]
        );

        const [rows] = await pool.query(
            "SELECT * FROM announcements WHERE id=?",
            [ret.insertId]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        httpError(res, 500, "create_announcement failed");
    }
});

/**
 * PUT /api/announcements/:id
 * body: { title?, content?, status?, visible_from?, visible_to? }
 */
router.put("/api/announcements/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return httpError(res, 400, "invalid id");

    const { title, content, status, visible_from, visible_to } = req.body;
    const fields = [];
    const params = [];

    if (title !== undefined) {
        fields.push("title=?");
        params.push(String(title).trim());
    }
    if (content !== undefined) {
        fields.push("content=?");
        params.push(content);
    }
    if (status !== undefined) {
        if (!["draft", "published", "archived"].includes(status)) {
            return httpError(res, 400, "invalid status");
        }
        fields.push("status=?");
        params.push(status);
    }
    if (visible_from !== undefined) {
        fields.push("visible_from=?");
        params.push(visible_from);
    }
    if (visible_to !== undefined) {
        fields.push("visible_to=?");
        params.push(visible_to);
    }

    if (!fields.length) {
        return httpError(res, 400, "no fields to update");
    }

    try {
        await pool.query(
            `UPDATE announcements SET ${fields.join(", ")} WHERE id=?`,
            [...params, id]
        );

        const [rows] = await pool.query(
            "SELECT * FROM announcements WHERE id=?",
            [id]
        );
        if (!rows.length) return httpError(res, 404, "not found");
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        httpError(res, 500, "update_announcement failed");
    }
});

/**
 * DELETE /api/announcements/:id
 * （真的刪掉；如果只想封存也可以改成 status='archived'）
 */
router.delete("/api/announcements/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return httpError(res, 400, "invalid id");

    try {
        const [ret] = await pool.query(
            "DELETE FROM announcements WHERE id=?",
            [id]
        );
        if (ret.affectedRows === 0) {
            return httpError(res, 404, "not found");
        }
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        httpError(res, 500, "delete_announcement failed");
    }
});

export default router;
