import { Request, Response } from "express";
import pool from "../config/db";

/* =========================
   PUBLIC APIs
========================= */

export const getAll = async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT category_id, name, description FROM categories"
    );
    res.json(rows);
  } catch (err: any) {
    console.error("getAll error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [rows]: any = await pool.query(
      "SELECT category_id, name, description FROM categories WHERE category_id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(rows[0]);
  } catch (err: any) {
    console.error("getById error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT product_id, name, description, price, image_url, category_id
       FROM products
       WHERE category_id = ?
       ORDER BY name ASC`,
      [categoryId]
    );

    res.json({ success: true, products: rows });
  } catch (err: any) {
    console.error("getProductsByCategory error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getCategoriesWithProducts = async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        c.category_id,
        c.name AS category_name,
        c.description AS category_image,
        p.product_id,
        p.name AS product_name,
        p.description,
        p.price,
        p.image_url AS product_image
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id
    `);

    const result: any = {};

    rows.forEach((row: any) => {
      if (!result[row.category_id]) {
        result[row.category_id] = {
          category_id: row.category_id,
          name: row.category_name,
          image: row.category_image,
          products: []
        };
      }

      if (row.product_id) {
        result[row.category_id].products.push({
          product_id: row.product_id,
          name: row.product_name,
          description: row.description,
          price: row.price,
          image_url: row.product_image
        });
      }
    });

    res.json(Object.values(result));
  } catch (err: any) {
    console.error("getCategoriesWithProducts error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   ADMIN APIs (REQUIRED)
========================= */

export const create = async (req: Request, res: Response) => {
  try {
    const { name, description = null } = req.body;
    const [result]: any = await pool.query(
      "INSERT INTO categories (name, description) VALUES (?, ?)",
      [name, description]
    );
    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err: any) {
    console.error("create error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, description = null } = req.body;
    await pool.query(
      "UPDATE categories SET name = ?, description = ? WHERE category_id = ?",
      [name, description, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error("update error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await pool.query("DELETE FROM product_categories WHERE category_id = ?", [id]);
    await pool.query("DELETE FROM categories WHERE category_id = ?", [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error("remove error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   MANY-TO-MANY SUPPORT
========================= */

export const getForProduct = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const [rows] = await pool.query(
      `SELECT c.* FROM categories c
       JOIN product_categories pc ON c.category_id = pc.category_id
       WHERE pc.product_id = ?`,
      [productId]
    );
    res.json(rows);
  } catch (err: any) {
    console.error("getForProduct error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const assign = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const { categoryId } = req.body;
    await pool.query(
      "INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)",
      [productId, categoryId]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error("assign error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const unassign = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const { categoryId } = req.body;
    await pool.query(
      "DELETE FROM product_categories WHERE product_id = ? AND category_id = ?",
      [productId, categoryId]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error("unassign error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const setForProduct = async (req: Request, res: Response) => {
  const conn = await (pool as any).getConnection();
  try {
    await conn.beginTransaction();
    const productId = Number(req.params.productId);
    const { categoryIds } = req.body;

    await conn.query(
      "DELETE FROM product_categories WHERE product_id = ?",
      [productId]
    );

    if (Array.isArray(categoryIds) && categoryIds.length) {
      const values = categoryIds.map((cid: number) => [productId, cid]);
      await conn.query(
        "INSERT INTO product_categories (product_id, category_id) VALUES ?",
        [values]
      );
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err: any) {
    await conn.rollback();
    console.error("setForProduct error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};
