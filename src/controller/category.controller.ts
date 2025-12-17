
import { Request, Response } from "express";
import pool from "../config/db";
import { Categories } from '../models/category.model';

export const getAll = async (req : Request, res : Response) => {
  try{
    const [rows] = await pool.query('SELECT * FROM categories');
    const category: Categories[] = rows as Categories[];
    res.json(category);
  } catch (err){
    console.error('Error fetching Categories :', err);
    res.status(500).json({message: 'server error'});
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    console.log('Requested ID:', req.params.id, 'Parsed ID:', id);

    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE category_id = ?',
      [id]
    );

    const category = rows as any[];
    if (category.length === 0)
      return res.status(404).json({ message: 'Category not found' });

    res.json(category[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCategoriesWithProducts = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.category_id, c.name AS category_name, c.image_url AS category_image,
             p.product_id, p.name AS product_name, p.description, p.price, p.image_url AS product_image
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id
    `);

    const data = rows as any[];

    const categories: any = {};
    data.forEach(row => {
      if (!categories[row.category_id]) {
        categories[row.category_id] = {
          category_id: row.category_id,
          name: row.category_name,
          image_url: row.category_image,
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
  } catch (err) {
    console.error('Error fetching categories with products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = Number(req.params.id);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid category id' });
    }

    const [rows] = await pool.query(
      `SELECT product_id, name, description, price, image_url, category_id
       FROM products
       WHERE category_id = ?
       ORDER BY name ASC`,
      [categoryId]
    );

    const products = rows as any[];
    return res.json({ success: true, products });
  } catch (err) {
    console.error('Error fetching products by category:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// === (new admin-capable handlers) ===

// Create category
export const create = async (req: Request, res: Response) => {
  try {
    const { name, image_url = null } = req.body;
    const [result]: any = await pool.query('INSERT INTO categories (name, image_url) VALUES (?,  ?)', [name, image_url]);
    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update category
export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, slug = null, image_url = null } = req.body;
    await pool.query('UPDATE categories SET name = ?, image_url = ? WHERE category_id = ?', [name, image_url, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete category
export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    // remove product_categories rows referencing this category
    // await pool.query('DELETE FROM product_categories WHERE category_id = ?', [id]);
    // delete category
    await pool.query('DELETE FROM categories WHERE category_id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get categories assigned to a product (many-to-many)
export const getForProduct = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const [rows] = await pool.query(
      `SELECT c.* FROM categories c
       JOIN product_categories pc ON c.category_id = pc.category_id
       WHERE pc.product_id = ?`, [productId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign a category to a product
export const assign = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const { categoryId } = req.body;
    await pool.query('INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)', [productId, categoryId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error assigning category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unassign
export const unassign = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const { categoryId } = req.body;
    await pool.query('DELETE FROM product_categories WHERE product_id = ? AND category_id = ?', [productId, categoryId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error unassigning category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Replace all category assignments for a product (transactional)
export const setForProduct = async (req: Request, res: Response) => {
  const conn = await (pool as any).getConnection();
  try {
    await conn.beginTransaction();
    const productId = Number(req.params.productId);
    const { categoryIds } = req.body; // array of ids
    await conn.query('DELETE FROM product_categories WHERE product_id = ?', [productId]);
    if (Array.isArray(categoryIds) && categoryIds.length) {
      const values = categoryIds.map((cid: number) => [productId, cid]);
      await conn.query('INSERT INTO product_categories (product_id, category_id) VALUES ?', [values]);
    }
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error setting categories for product:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};
