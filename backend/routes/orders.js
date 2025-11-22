import express from "express";
import pool from "../db.js";

const router = express.Router();

// 小工具：統一丟錯
function httpError(res, status, message) {
  return res.status(status).json({ error: message });
}

/**
 * POST /api/order/create
 * body: { buyer_id, product_id }
 */
router.post("/create", async (req, res) => {
  const { buyer_id, product_id } = req.body;
  if (!buyer_id || !product_id) {
    return httpError(res, 400, "buyer_id & product_id required");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 檢查商品存在且 on_sale
    const [pRows] = await conn.query(
      "SELECT * FROM products WHERE product_id = ? FOR UPDATE",
      [product_id]
    );
    if (pRows.length === 0) {
      await conn.rollback();
      return httpError(res, 404, "Product not found");
    }
    const product = pRows[0];
    if (product.status !== "on_sale") {
      await conn.rollback();
      return httpError(res, 400, "Product not available for sale");
    }

    // 2) 建 order（鎖價 order_price）
    const [oRet] = await conn.query(
      `INSERT INTO orders (product_id, buyer_id, seller_id, order_price, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [product_id, buyer_id, product.seller_id, product.price]
    );

    const order_id = oRet.insertId;

    // 3) log
    await conn.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by, note)
       VALUES (?, NULL, 'pending', ?, 'create order')`,
      [order_id, buyer_id]
    );

    await conn.commit();

    const [orderRows] = await conn.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [order_id]
    );
    res.json(orderRows[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    httpError(res, 500, "create_order failed");
  } finally {
    conn.release();
  }
});

/**
 * PUT /api/order/confirm
 * body: { order_id, seller_id }
 */
router.put("/confirm", async (req, res) => {
  const { order_id, seller_id } = req.body;
  if (!order_id || !seller_id) {
    return httpError(res, 400, "order_id & seller_id required");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [oRows] = await conn.query(
      "SELECT * FROM orders WHERE order_id = ? FOR UPDATE",
      [order_id]
    );
    if (oRows.length === 0) {
      await conn.rollback();
      return httpError(res, 404, "Order not found");
    }
    const order = oRows[0];
    if (order.status !== "pending") {
      await conn.rollback();
      return httpError(res, 400, "Only pending orders can be confirmed");
    }
    if (order.seller_id !== seller_id) {
      await conn.rollback();
      return httpError(res, 403, "Only the seller can confirm");
    }

    const [pRows] = await conn.query(
      "SELECT * FROM products WHERE product_id = ? FOR UPDATE",
      [order.product_id]
    );
    if (pRows.length === 0) {
      await conn.rollback();
      return httpError(res, 500, "Product missing");
    }
    const product = pRows[0];
    if (product.status !== "on_sale") {
      await conn.rollback();
      return httpError(res, 400, "Product is not available");
    }

    // 更新狀態
    await conn.query(
      "UPDATE orders SET status='confirmed', confirmed_at=NOW() WHERE order_id=?",
      [order_id]
    );
    await conn.query(
      "UPDATE products SET status='sold', buyer_id=?, sold_at=NOW() WHERE product_id=?",
      [order.buyer_id, order.product_id]
    );

    // log
    await conn.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by, note)
       VALUES (?, 'pending', 'confirmed', ?, 'seller confirmed')`,
      [order_id, seller_id]
    );

    await conn.commit();

    const [newRows] = await conn.query(
      "SELECT * FROM orders WHERE order_id=?",
      [order_id]
    );
    res.json(newRows[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    httpError(res, 500, "confirm_order failed");
  } finally {
    conn.release();
  }
});

/**
 * PUT /api/order/finish
 * body: { order_id, by_user_id }
 */
router.put("/finish", async (req, res) => {
  const { order_id, by_user_id } = req.body;
  if (!order_id || !by_user_id) {
    return httpError(res, 400, "order_id & by_user_id required");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [oRows] = await conn.query(
      "SELECT * FROM orders WHERE order_id=? FOR UPDATE",
      [order_id]
    );
    if (oRows.length === 0) {
      await conn.rollback();
      return httpError(res, 404, "Order not found");
    }
    const order = oRows[0];
    if (order.status !== "confirmed") {
      await conn.rollback();
      return httpError(res, 400, "Only confirmed orders can be finished");
    }
    if (by_user_id !== order.buyer_id && by_user_id !== order.seller_id) {
      await conn.rollback();
      return httpError(res, 403, "Not part of this order");
    }

    await conn.query(
      "UPDATE orders SET status='completed', finished_at=NOW() WHERE order_id=?",
      [order_id]
    );

    await conn.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by, note)
       VALUES (?, 'confirmed', 'completed', ?, 'finish order')`,
      [order_id, by_user_id]
    );

    await conn.commit();
    const [newRows] = await conn.query(
      "SELECT * FROM orders WHERE order_id=?",
      [order_id]
    );
    res.json(newRows[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    httpError(res, 500, "finish_order failed");
  } finally {
    conn.release();
  }
});

/**
 * PUT /api/order/cancel
 * body: { order_id, by_user_id }
 */
router.put("/cancel", async (req, res) => {
  const { order_id, by_user_id } = req.body;
  if (!order_id || !by_user_id) {
    return httpError(res, 400, "order_id & by_user_id required");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [oRows] = await conn.query(
      "SELECT * FROM orders WHERE order_id=? FOR UPDATE",
      [order_id]
    );
    if (oRows.length === 0) {
      await conn.rollback();
      return httpError(res, 404, "Order not found");
    }
    const order = oRows[0];
    if (order.status === "completed" || order.status === "cancelled") {
      await conn.rollback();
      return httpError(res, 400, "Order is already finalized");
    }
    if (by_user_id !== order.buyer_id && by_user_id !== order.seller_id) {
      await conn.rollback();
      return httpError(res, 403, "Not part of this order");
    }

    await conn.query(
      "UPDATE orders SET status='cancelled', canceled_at=NOW() WHERE order_id=?",
      [order_id]
    );

    // 商品如果已 sold 就退回 on_sale
    const [pRows] = await conn.query(
      "SELECT * FROM products WHERE product_id=? FOR UPDATE",
      [order.product_id]
    );
    if (pRows.length > 0 && pRows[0].status === "sold") {
      await conn.query(
        "UPDATE products SET status='on_sale', buyer_id=NULL, sold_at=NULL WHERE product_id=?",
        [order.product_id]
      );
    }

    await conn.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by, note)
       VALUES (?, ?, 'cancelled', ?, 'cancel order')`,
      [order_id, order.status, by_user_id]
    );

    await conn.commit();
    const [newRows] = await conn.query(
      "SELECT * FROM orders WHERE order_id=?",
      [order_id]
    );
    res.json(newRows[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    httpError(res, 500, "cancel_order failed");
  } finally {
    conn.release();
  }
});

/**
 * GET /api/order/list?buyer_id=&seller_id=&status=&limit=&offset=
 */
router.get("/list", async (req, res) => {
  const { buyer_id, seller_id, status, limit = 20, offset = 0 } = req.query;

  const conds = [];
  const params = [];

  if (buyer_id) { conds.push("o.buyer_id=?"); params.push(Number(buyer_id)); }
  if (seller_id) { conds.push("o.seller_id=?"); params.push(Number(seller_id)); }
  if (status) { conds.push("o.status=?"); params.push(status); }

  const whereSql = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

  try {
    const [rows] = await pool.query(
      `SELECT o.*, p.title AS product_title, p.price AS product_price, p.cover_image_url AS product_cover
       FROM orders o
       JOIN products p ON p.product_id = o.product_id
       ${whereSql}
       ORDER BY o.order_id DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM orders o ${whereSql}`,
      params
    );

    res.json({ total: countRows[0].total, items: rows });
  } catch (err) {
    console.error(err);
    httpError(res, 500, "list_orders failed");
  }
});

export default router;
