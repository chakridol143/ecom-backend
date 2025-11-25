import { Request, Response } from "express";
import pool from "../config/db";
import {Categories} from '../models/category.model';

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
      'SELECT * FROM Categories WHERE category_id = ?',
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
