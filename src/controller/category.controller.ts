import { Request, Response } from "express";
import pool from "../config/db";
import { Categories } from "../models/category.model";

/**
 * GET ALL CATEGORIES
 */
export const getAll = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT category_id, name, description FROM Categories"
    );
    res.json(rows);
  } catch (err: any) {
    console.error("getAll Categories error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET CATEGORY BY ID
 */
export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const [rows]: any = await pool.query(
      "SELECT category_id, name, description FROM Categories WHERE category_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(rows[0]);
  } catch (err: any) {
    console.error("getById error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET CATEGORIES WITH PRODUCTS
 */
export const getCategoriesWithProducts = async (req: Request, res: Response) => {
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
      FROM Categories c
      LEFT JOIN products p ON c.category_id = p.category_id
    `);

    const categories: any = {};

    rows.forEach((row: any) => {
      if (!categories[row.category_id]) {
        categories[row.category_id] = {
          category_id: row.category_id,
          name: row.category_name,
          image: row.category_image,
          products: []
        };
      }

      if (row.product_id) {
        categories[row.category_id].products.push({
          product_id: row.product_id,
          name: row.product_name,
          description: row.description,
          price: row.price,
          image_url: row.product_image
        });
      }
    });

    res.json(Object.values(categories));
  } catch (err: any) {
    console.error("getCategoriesWithProducts error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET PRODUCTS BY CATEGORY
 */
export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = Number(req.params.id);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const [rows] = await pool.query(
      `
      SELECT product_id, name, description, price, image_url, category_id
      FROM products
      WHERE category_id = ?
      ORDER BY name ASC
      `,
      [categoryId]
    );

    res.json({ success: true, products: rows });
  } catch (err: any) {
    console.error("getProductsByCategory error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * CREATE CATEGORY
 */
export const create = async (req: Request, res: Response) => {
  try {
    const { name, description = null } = req.body;

    const [result]: any = await pool.query(
      "INSERT INTO Categories (name, description) VALUES (?, ?)",
      [name, description]
    );

    res.status(201).json({
      success: true,
      insertId: result.insertId
    });
  } catch (err: any) {
    console.error("create Category error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * UPDATE CATEGORY
 */
export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, description = null } = req.body;

    await pool.query(
      "UPDATE Categories SET name = ?, description = ? WHERE category_id = ?",
      [name, description, id]
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error("update Category error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE CATEGORY
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    await pool.query(
      "DELETE FROM product_categories WHERE category_id = ?",
      [id]
    );

    await pool.query(
      "DELETE FROM Categories WHERE category_id = ?",
      [id]
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error("remove Category error:", err);
    res.status(500).json({ error: err.message });
  }
};
