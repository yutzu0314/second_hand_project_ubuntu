// routes/reviews.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// 建立評價
router.post("/create", async (req, res) => {
    const { order_id, buyer_id, rating, comment } = req.body;

    if (!order_id || !buyer_id || !rating) {
        return res.status(400).json({ error: "order_id, buyer_id, rating required" });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "rating must be 1~5" });
    }

    const conn = await pool.getConnection();
    try {
        // 1. 檢查訂單
        const [rows] = await conn.query(
            `SELECT order_id, buyer_id, seller_id, status
       FROM orders
       WHERE order_id = ?`,
            [order_id]
        );

        if (!rows.length) {
            return res.status(404).json({ error: "Order not found" });
        }

        const order = rows[0];

        if (order.buyer_id !== buyer_id) {
            return res.status(403).json({ error: "Not your order" });
        }

        if (order.status !== "completed") {
            return res.status(400).json({ error: "Order not completed" });
        }

        // 2. 建立評價
        await conn.query(
            `INSERT INTO reviews (order_id, buyer_id, seller_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
            [order_id, buyer_id, order.seller_id, rating, comment || null]
        );

        res.json({ success: true });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Already reviewed" });
        }
        console.error(err);
        res.status(500).json({ error: "Server error" });
    } finally {
        conn.release();
    }
});

module.exports = router;

router.get("/my", async (req, res) => {
    const { buyer_id } = req.query;
    if (!buyer_id) return res.status(400).json({ error: "buyer_id required" });

    const [rows] = await pool.query(
        `SELECT r.*, o.product_id, p.title AS product_title
     FROM reviews r
     JOIN orders o ON r.order_id = o.order_id
     JOIN products p ON o.product_id = p.product_id
     WHERE r.buyer_id = ?
     ORDER BY r.created_at DESC`,
        [buyer_id]
    );

    res.json({ total: rows.length, items: rows });
});

router.get("/seller", async (req, res) => {
    const { seller_id } = req.query;
    if (!seller_id) return res.status(400).json({ error: "seller_id required" });

    const [rows] = await pool.query(
        `SELECT r.*, u.name AS buyer_name, p.title AS product_title
     FROM reviews r
     JOIN users u ON r.buyer_id = u.user_id
     JOIN orders o ON r.order_id = o.order_id
     JOIN products p ON o.product_id = p.product_id
     WHERE r.seller_id = ?
     ORDER BY r.created_at DESC`,
        [seller_id]
    );

    res.json({ total: rows.length, items: rows });
});
