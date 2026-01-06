import express from "express";
import pool from "../db.js";

const router = express.Router();

function httpError(res, status, message) {
  return res.status(status).json({ error: message });
}

// GET /api/messages/list?order_id=5&user_id=2
router.get("/list", async (req, res) => {
  const { order_id, user_id } = req.query;
  if (!order_id || !user_id) return httpError(res, 400, "order_id & user_id required");

  try {
    // 1) 確認這個 user 是該訂單買家或賣家
    const [oRows] = await pool.query(
      "SELECT order_id, buyer_id, seller_id FROM orders WHERE order_id=?",
      [Number(order_id)]
    );
    if (oRows.length === 0) return httpError(res, 404, "Order not found");

    const o = oRows[0];
    const uid = Number(user_id);
    if (uid !== o.buyer_id && uid !== o.seller_id) {
      return httpError(res, 403, "Not allowed");
    }

    // 2) 撈訊息
    const [items] = await pool.query(
      `SELECT message_id, order_id, sender_id, receiver_id, content, created_at
       FROM messages
       WHERE order_id=?
       ORDER BY message_id ASC`,
      [Number(order_id)]
    );

    res.json({ total: items.length, items });
  } catch (e) {
    console.error(e);
    httpError(res, 500, "list_messages failed");
  }
});

// POST /api/messages/send  { order_id, sender_id, content }
router.post("/send", async (req, res) => {
  const { order_id, sender_id, content } = req.body;
  if (!order_id || !sender_id || !content) {
    return httpError(res, 400, "order_id, sender_id, content required");
  }

  const oid = Number(order_id);
  const sid = Number(sender_id);
  const text = String(content).trim();
  if (!text) return httpError(res, 400, "content cannot be empty");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 查訂單，決定 receiver_id
    const [oRows] = await conn.query(
      "SELECT order_id, buyer_id, seller_id FROM orders WHERE order_id=? FOR UPDATE",
      [oid]
    );
    if (oRows.length === 0) {
      await conn.rollback();
      return httpError(res, 404, "Order not found");
    }
    const o = oRows[0];

    if (sid !== o.buyer_id && sid !== o.seller_id) {
      await conn.rollback();
      return httpError(res, 403, "Not allowed");
    }

    const receiver_id = (sid === o.buyer_id) ? o.seller_id : o.buyer_id;

    // 2) 寫入 messages
    const [ret] = await conn.query(
      `INSERT INTO messages (order_id, sender_id, receiver_id, content)
       VALUES (?, ?, ?, ?)`,
      [oid, sid, receiver_id, text]
    );

    const [rows] = await conn.query(
      "SELECT * FROM messages WHERE message_id=?",
      [ret.insertId]
    );

    await conn.commit();
    res.json(rows[0]);
  } catch (e) {
    await conn.rollback();
    console.error(e);
    httpError(res, 500, "send_message failed");
  } finally {
    conn.release();
  }
});

export default router;
