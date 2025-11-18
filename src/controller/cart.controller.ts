
import { Request, Response } from "express";
import db from "../config/db"; 
import { CartItem } from "../models/cart.model";


export const getAllCartItems = async (req: Request, res: Response) => {
  const query = "SELECT * FROM Cart_Items";
  try {
    const [rows] = await db.query<CartItem[]>(query);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching cart items:", err);
    return res.status(500).json({ error: "Failed to fetch cart items" });
  }
};

export const getCartItemById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid cart item id" });
  }

  const query = "SELECT * FROM Cart_Items WHERE cart_item_id = ?";
  try {
    const [rows] = await db.query<CartItem[]>(query, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching cart item:", err);
    return res.status(500).json({ error: "Failed to fetch cart item" });
  }
};

export const addCartItem = async (req: Request, res: Response) => {
  const { user_id, product_id, quantity } = req.body;
  console.log('Received addCartItem request with body:', req.body);

  if (typeof user_id === "undefined" || typeof product_id === "undefined" || typeof quantity === "undefined") {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const qUserId = Number(user_id);
  const qProductId = Number(product_id);
  const qQuantity = Number(quantity);

  if (Number.isNaN(qUserId) || Number.isNaN(qProductId) || Number.isNaN(qQuantity) || qQuantity <= 0) {
    return res.status(400).json({ error: "Invalid user_id, product_id or quantity" });
  }

  const query = `
    INSERT INTO Cart_Items (user_id, product_id, quantity, added_at)
    VALUES (?, ?, ?, NOW())
  `;

  try {
    const [result] = await db.query<any>(query, [qUserId, qProductId, qQuantity]);
    // result.insertId is available for insert
    return res.status(201).json({
      message: "Cart item added successfully",
      cart_item_id: (result as any).insertId,
    });
  } catch (err) {
    console.error("Error adding cart item:", err);
    return res.status(500).json({ error: "Failed to add cart item" });
  }
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { quantity } = req.body;

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid cart item id" });
  }
  if (typeof quantity === "undefined") {
    return res.status(400).json({ error: "Quantity is required" });
  }

  const qQuantity = Number(quantity);
  if (Number.isNaN(qQuantity) || qQuantity <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  const query = "UPDATE Cart_Items SET quantity = ? WHERE cart_item_id = ?";
  try {
    const [result] = await db.query<any>(query, [qQuantity, id]);
    // affectedRows check
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    return res.status(200).json({ message: "Cart item updated successfully" });
  } catch (err) {
    console.error("Error updating cart item:", err);
    return res.status(500).json({ error: "Failed to update cart item" });
  }
};

// Delete a cart item
export const deleteCartItem = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid cart item id" });
  }

  const query = "DELETE FROM Cart_Items WHERE cart_item_id = ?";
  try {
    const [result] = await db.query<any>(query, [id]);
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    return res.status(200).json({ message: "Cart item deleted successfully" });
  } catch (err) {
    console.error("Error deleting cart item:", err);
    return res.status(500).json({ error: "Failed to delete cart item" });
  }
};
