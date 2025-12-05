
import { Request, Response } from 'express';
import pool from '../config/db';
import { Product } from '../models/product.model';
import path from 'path';
import fs from 'fs';
import { normalizeImagePath } from "../utils/files";

const assetsDir = path.join(__dirname, '..', '..', 'assets', 'images');

function tryDeleteFile(filename?: string | null) {
  if (!filename) return;
  const p = path.join(assetsDir, filename);
  if (fs.existsSync(p)) {
    try { fs.unlinkSync(p); } catch (e) { console.warn('Could not delete file', p, e); }
  }
}


export const getAll = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         product_id,
         name,
         description,
         price,
         stock_quantity,
         category_id,
         image_url,
         image_url1,
         image_url2,
         image_url3,
         image_url4,
         created_at
       FROM products
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    console.log('Requested ID:', req.params.id, 'Parsed ID:', id);

    const [rows] = await pool.query('SELECT * FROM products WHERE product_id = ?', [id]);
    const products = rows as any[];
    if (products.length === 0) return res.status(404).json({ message: 'Product not found' });

    // fetch assigned categories (many-to-many)
    const [cats] = await pool.query(
      `SELECT c.category_id, c.name
       FROM categories c
       JOIN product_categories pc ON c.category_id = pc.category_id
       WHERE pc.product_id = ?`, [id]
    );

    const product = products[0];
    (product as any).categories = cats;
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchByName = async (req: Request, res: Response) => {
  try {
    const name = String(req.params.name || '');
    // use LIKE properly with wildcards
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE name LIKE ?',
      [`%${name}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error searching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getByCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = Number(req.params.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM products WHERE category_id = ?',
      [categoryId]
    );

    const products = rows as any[];
    res.json(products);
  } catch (err) {
    console.error('Error fetching products by category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

//(new admin-capable handlers)

export const create = async (req: Request, res: Response) => {
  try {
    // parse and coerce incoming values
    const name = req.body.name as string;
    const description = (req.body.description as string) || null;
    const price = Number(req.body.price ?? 0);
    const stock_quantity = Number(req.body.stock_quantity ?? 0);
    const category_id = req.body.category_id ? Number(req.body.category_id) : null;

    // image values may be filenames (from multer) — normalize to assets/images/...
    const image_url = normalizeImagePath(req.body.image_url as string | null);
    const image_url1 = normalizeImagePath(req.body.image_url1 as string | null);
    const image_url2 = normalizeImagePath(req.body.image_url2 as string | null);
    const image_url3 = normalizeImagePath(req.body.image_url3 as string | null);
    const image_url4 = normalizeImagePath(req.body.image_url4 as string | null);

    if (!name) return res.status(400).json({ message: "Product name is required" });

    const [result]: any = await pool.query(
      `INSERT INTO products
        (name, description, price, stock_quantity, category_id, image_url, image_url1, image_url2, image_url3, image_url4)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        price,
        stock_quantity,
        category_id,
        image_url,
        image_url1,
        image_url2,
        image_url3,
        image_url4
      ]
    );

    const insertId = result.insertId;
    const [rows]: any = await pool.query("SELECT * FROM products WHERE product_id = ?", [insertId]);
    return res.status(201).json({ success: true, product: rows[0] });
  } catch (err) {
    console.error("Error creating product:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update product (updated)
export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid product id" });

    // fetch existing row
    const [[existingRow]] = await pool.query('SELECT * FROM products WHERE product_id = ?', [id]) as any;
    if (!existingRow) return res.status(404).json({ message: 'Product not found' });

    // take new values if present, otherwise fallback to existing
    const name = req.body.name ?? existingRow.name;
    const description = req.body.description ?? existingRow.description;
    const price = req.body.price !== undefined ? Number(req.body.price) : existingRow.price;
    const stock_quantity = req.body.stock_quantity !== undefined ? Number(req.body.stock_quantity) : existingRow.stock_quantity;
    const category_id = req.body.category_id !== undefined ? (req.body.category_id ? Number(req.body.category_id) : null) : existingRow.category_id;

    // normalize incoming image paths (if router mapped filenames into req.body)
    const image_url = req.body.image_url ? normalizeImagePath(req.body.image_url as string) : undefined;
    const image_url1 = req.body.image_url1 ? normalizeImagePath(req.body.image_url1 as string) : undefined;
    const image_url2 = req.body.image_url2 ? normalizeImagePath(req.body.image_url2 as string) : undefined;
    const image_url3 = req.body.image_url3 ? normalizeImagePath(req.body.image_url3 as string) : undefined;
    const image_url4 = req.body.image_url4 ? normalizeImagePath(req.body.image_url4 as string) : undefined;

    // delete replaced files (only if incoming is different and exists)
    if (image_url && existingRow.image_url && existingRow.image_url !== image_url) tryDeleteFile(existingRow.image_url);
    if (image_url1 && existingRow.image_url1 && existingRow.image_url1 !== image_url1) tryDeleteFile(existingRow.image_url1);
    if (image_url2 && existingRow.image_url2 && existingRow.image_url2 !== image_url2) tryDeleteFile(existingRow.image_url2);
    if (image_url3 && existingRow.image_url3 && existingRow.image_url3 !== image_url3) tryDeleteFile(existingRow.image_url3);
    if (image_url4 && existingRow.image_url4 && existingRow.image_url4 !== image_url4) tryDeleteFile(existingRow.image_url4);

    await pool.query(
      `UPDATE products
       SET name=?, description=?, price=?, stock_quantity=?, category_id=?, image_url=?, image_url1=?, image_url2=?, image_url3=?, image_url4=?
       WHERE product_id = ?`,
      [
        name,
        description ?? null,
        price,
        stock_quantity,
        category_id ?? null,
        image_url ?? existingRow.image_url ?? null,
        image_url1 ?? existingRow.image_url1 ?? null,
        image_url2 ?? existingRow.image_url2 ?? null,
        image_url3 ?? existingRow.image_url3 ?? null,
        image_url4 ?? existingRow.image_url4 ?? null,
        id
      ]
    );

    const [rows]: any = await pool.query('SELECT * FROM products WHERE product_id = ?', [id]);
    return res.json({ success: true, product: rows[0] });
  } catch (err) {
    console.error('Error updating product:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
// Remove product (updated)
export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid product id" });

    const [[existingRow]] = await pool.query('SELECT * FROM products WHERE product_id = ?', [id]) as any;
    if (!existingRow) return res.status(404).json({ message: 'Product not found' });

    // delete files (silent if missing)
    tryDeleteFile(existingRow.image_url);
    tryDeleteFile(existingRow.image_url1);
    tryDeleteFile(existingRow.image_url2);
    tryDeleteFile(existingRow.image_url3);
    tryDeleteFile(existingRow.image_url4);

    // delete product_categories mapping (if present)
    await pool.query('DELETE FROM product_categories WHERE product_id = ?', [id]);

    // delete product
    await pool.query('DELETE FROM products WHERE product_id = ?', [id]);

    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting product:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
