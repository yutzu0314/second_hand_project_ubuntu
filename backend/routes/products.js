import express from "express";
import pool from "../db.js";

const router = express.Router();

function httpError(res, status, message) {
  return res.status(status).json({ error: message });
}

/**
 * GET /api/products/list?q=&status=&seller_id=&limit=&offset=
 */
router.get("/list", async (req, res) => {
  const { q, status, seller_id, limit = 20, offset = 0 } = req.query;

  const conds = [];
  const params = [];

  if (status) { conds.push("status=?"); params.push(status); }
  if (seller_id) { conds.push("seller_id=?"); params.push(Number(seller_id)); }
  if (q) {
    conds.push("(title LIKE ? OR description LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  const whereSql = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

  try {
    const [items] = await pool.query(
      `SELECT * FROM products
       ${whereSql}
       ORDER BY product_id DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM products ${whereSql}`,
      params
    );

    res.json({ total: countRows[0].total, items });
  } catch (err) {
    console.error(err);
    httpError(res, 500, "list_products failed");
  }
});

/**
 * POST /api/products/create
 * body: { seller_id, title, description, price, status='on_sale', cover_image_url }
 */
router.post("/create", async (req, res) => {
  const {
    seller_id,
    title,
    description = null,
    price,
    status = "on_sale",
    cover_image_url = null,
  } = req.body;

  if (!seller_id || !title || !price) {
    return httpError(res, 400, "seller_id, title, price required");
  }

  // 用你們原本 enum
  if (!["on_sale", "sold", "removed", "reported"].includes(status)) {
    return httpError(res, 400, "invalid status");
  }

  const t = String(title).trim();
  if (!t) return httpError(res, 400, "title cannot be empty");

  try {
    const [ret] = await pool.query(
      `INSERT INTO products (seller_id, title, description, price, status, cover_image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [seller_id, t, description, price, status, cover_image_url]
    );

    const [rows] = await pool.query(
      "SELECT * FROM products WHERE product_id=?",
      [ret.insertId]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    httpError(res, 500, "create_product failed");
  }
});

export default router;
