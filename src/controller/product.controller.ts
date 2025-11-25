
import { Request, Response } from 'express';
import pool from '../config/db';
import { Product } from '../models/product.model';

export const getAll = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    const products: Product[] = rows as Product[];
    res.json(products);
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

    res.json(products[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
  
export const searchByName = async (req: Request, res: Response) => {
  try {
    const name = req.params.name;
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE name = ?',
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



