import { Request, Response } from "express";
import db from "../config/db";
import { CartItem } from "../models/cart.model";

/* ---------------------------- GET ALL CART ITEMS ---------------------------- */
export const getAllCartItems = async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query<CartItem[]>(`SELECT * FROM cart_items`);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching cart items:", err);
    return res.status(500).json({ error: "Failed to fetch cart items" });
  }
};

/* ------------------------------- GET BY ID -------------------------------- */
export const getCartItemById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid cart item id" });
  }

  try {
    const [rows] = await db.query<CartItem[]>(
      `SELECT * FROM cart_items WHERE cart_item_id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching cart item:", err);
    return res.status(500).json({ error: "Failed to fetch cart item" });
  }
};

/* ------------------------- GET CART BY USER ID ---------------------------- */
export const getcartByUserId = async (req: Request, res: Response) => {
  const user_Id = Number(req.params.user_Id);
  if (Number.isNaN(user_Id)) {
    return res.status(400).json({ error: "Invalid User" });
  }

  const query = `
    SELECT 
      ci.cart_item_id,
      ci.user_id,
      ci.product_id,
      ci.quantity,
      p.name,
      p.price,
      CONCAT(
  '[\"', IFNULL(p.image_url, ''), '\",',
  '\"', IFNULL(p.image_url1, ''), '\",',
  '\"', IFNULL(p.image_url2, ''), '\",',
  '\"', IFNULL(p.image_url3, ''), '\",',
  '\"', IFNULL(p.image_url4, ''), '\"]'
) AS images,

    p.description
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    WHERE ci.user_id = ?
  `;

  try {
    const [rows] = await db.query(query, [user_Id]);
    return res.status(200).json(rows || []);
  } catch (err: any) {
    console.error("❌ Error Fetching Users Cart Items:", err);
    return res.status(500).json({
      error: err.sqlMessage || "Failed to fetch user's cart items"
    });
  }
};


/* ---------------------------- ADD CART ITEM ------------------------------- */
export const addCartItem = async (req: Request, res: Response) => {
  const { user_id, product_id, quantity } = req.body;

  console.log("🟦 addCartItem body:", req.body);

  if (!user_id || !product_id || !quantity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const qUser = Number(user_id);
  const qProd = Number(product_id);
  const qQty = Number(quantity);

  if (Number.isNaN(qUser) || Number.isNaN(qProd) || Number.isNaN(qQty)) {
    return res.status(400).json({ error: "Invalid inputs" });
  }

  const query = `
    INSERT INTO cart_items (user_id, product_id, quantity, added_at)
    VALUES (?, ?, ?, NOW())
  `;

  try {
    const [result] = await db.query<any>(query, [qUser, qProd, qQty]);

    return res.status(201).json({
      message: "Cart item added successfully",
      cart_item_id: result.insertId,
    });
  } catch (err: any) {
    console.error("❌ SQL ERROR inserting cart item:", err);
    return res.status(500).json({
      error: err.sqlMessage || "Failed to add cart item",
    });
  }
};

/* ---------------------------- UPDATE CART ITEM ---------------------------- */
export const updateCartItem = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { quantity } = req.body;

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid cart item id" });
  }

  if (!quantity) {
    return res.status(400).json({ error: "Quantity is required" });
  }

  const qQty = Number(quantity);
  if (qQty <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  try {
    const [result] = await db.query<any>(
      `UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?`,
      [qQty, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    return res.status(200).json({ message: "Cart item updated successfully" });
  } catch (err) {
    console.error("❌ Error updating cart item:", err);
    return res.status(500).json({ error: "Failed to update cart item" });
  }
};

/* ---------------------------- DELETE CART ITEM ---------------------------- */
export const deleteCartItem = async (req: Request, res: Response) => {
  const user_id = Number(req.params.user_id);
  const product_id = Number(req.params.product_id);

  if (Number.isNaN(user_id) || Number.isNaN(product_id)) {
    return res.status(400).json({ error: "Invalid user_id or product_id" });
  }

  try {
    const [result] = await db.query<any>(
      `DELETE FROM cart_items WHERE user_id = ? AND product_id = ?`,
      [user_id, product_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    return res.status(200).json({ message: "Cart item deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting cart item:", err);
    return res.status(500).json({ error: "Failed to delete cart item" });
  }
};
