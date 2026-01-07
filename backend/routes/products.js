import express from "express";
import pool from "../db.js";

const router = express.Router();

function httpError(res, status, message) {
  return res.status(status).json({ error: message });
}

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: 商品相關 API
 */

/**
 * @swagger
 * /api/products/list:
 *   get:
 *     summary: 取得商品列表
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 關鍵字（會搜尋 title / description）
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: on_sale
 *         description: 商品狀態
 *       - in: query
 *         name: seller_id
 *         schema:
 *           type: integer
 *         description: 賣家 ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: 成功取得商品列表
 */
router.get("/list", async (req, res) => {
  const { q, status, seller_id, limit = 20, offset = 0 } = req.query;

  const conds = [];
  const params = [];

  if (status) { conds.push("p.status=?"); params.push(status); }
  if (seller_id) { conds.push("p.seller_id=?"); params.push(Number(seller_id)); }
  if (q) {
    conds.push("(p.title LIKE ? OR p.description LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  const whereSql = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

  const baseFrom = `
    FROM products p
    JOIN users u ON u.user_id = p.seller_id
  `;

  try {
    const [items] = await pool.query(
      `
      SELECT p.*, u.name AS seller_username
      ${baseFrom}
      ${whereSql}
      ORDER BY p.product_id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );

    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) as total
      ${baseFrom}
      ${whereSql}
      `,
      params
    );

    res.json({ total: countRows[0].total, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "list_products failed" });
  }
});



/**
 * @swagger
 * /api/products/create:
 *   post:
 *     summary: 新增商品
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seller_id
 *               - title
 *               - price
 *             properties:
 *               seller_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               status:
 *                 type: string
 *                 description: 商品狀態（on_sale / sold / removed / reported）
 *               cover_image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: 商品建立成功
 */
router.post("/create", async (req, res) => {
  const {
    seller_id,
    title,
    description = null,
    price,
    status = "on_sale",
    cover_image_url = "",
  } = req.body;

  if (!seller_id || !title || !price) {
    return httpError(res, 400, "seller_id, title, price required");
  }

  // 用你們原本 enum
  if (!["on_sale", "reserved", "sold", "removed", "reported"].includes(status)) {
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

/**
 * @swagger
 * /api/products/update:
 *   put:
 *     summary: 更新商品（賣家）
 *     tags: [Products]
 */
router.put("/update", async (req, res) => {
  const { product_id, seller_id, title, description, price } = req.body;

  if (!product_id || !seller_id || !title || price === undefined) {
    return httpError(res, 400, "product_id, seller_id, title, price required");
  }

  const t = String(title).trim();
  if (!t) return httpError(res, 400, "title cannot be empty");

  const p = Number(price);
  if (!Number.isFinite(p) || p <= 0) return httpError(res, 400, "invalid price");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 只允許賣家改自己的商品，且避免改到已售出/保留（可依你們規則調整）
    const [rows] = await conn.query(
      "SELECT * FROM products WHERE product_id=? FOR UPDATE",
      [Number(product_id)]
    );
    if (!rows.length) {
      await conn.rollback();
      return httpError(res, 404, "Product not found");
    }

    const product = rows[0];
    if (Number(product.seller_id) !== Number(seller_id)) {
      await conn.rollback();
      return httpError(res, 403, "Not your product");
    }

    if (["sold", "reserved"].includes(product.status)) {
      await conn.rollback();
      return httpError(res, 400, "Cannot edit sold/reserved product");
    }

    await conn.query(
      "UPDATE products SET title=?, description=?, price=? WHERE product_id=?",
      [t, description ?? null, p, Number(product_id)]
    );

    await conn.commit();

    const [newRows] = await pool.query(
      "SELECT * FROM products WHERE product_id=?",
      [Number(product_id)]
    );
    res.json(newRows[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    httpError(res, 500, "update_product failed");
  } finally {
    conn.release();
  }
});

/**
 * @swagger
 * /api/products/delete:
 *   delete:
 *     summary: 刪除商品（真刪除）
 *     tags: [Products]
 */
router.delete("/delete", async (req, res) => {
  const { product_id, seller_id } = req.body;

  if (!product_id || !seller_id) {
    return httpError(res, 400, "product_id & seller_id required");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [pRows] = await conn.query(
      "SELECT * FROM products WHERE product_id=? FOR UPDATE",
      [Number(product_id)]
    );
    if (!pRows.length) {
      await conn.rollback();
      return httpError(res, 404, "Product not found");
    }

    const product = pRows[0];
    if (Number(product.seller_id) !== Number(seller_id)) {
      await conn.rollback();
      return httpError(res, 403, "Not your product");
    }

    // ✅ 若已經有訂單，真刪除會讓系統資料斷掉（也可能外鍵會擋）
    const [oRows] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM orders WHERE product_id=?",
      [Number(product_id)]
    );
    if (Number(oRows[0].cnt) > 0) {
      await conn.rollback();
      return httpError(res, 409, "This product has orders, cannot delete");
    }

    // 可選：若有 messages / reviews 也要一起擋或先刪（依你們 schema）
    await conn.query("DELETE FROM products WHERE product_id=?", [Number(product_id)]);

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    console.error("create_product failed:", err);
    return res.status(500).json({
      error: "create_product failed",
      code: err.code,
      sqlMessage: err.sqlMessage,
      message: err.message,
    });
  } finally {
    conn.release();
  }
});


export default router;
