
import { Request, Response } from "express";
import db from "../config/db"; 
import { CartItem } from "../models/cart.model";


// Get all cart items
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

// Get a single cart item by ID
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

// export const addMultipleCartItems = async (req: Request, res: Response) => {
//   const items = req.body; 
//   console.log('Received addMultipleCartItems request with body:', items);

//   if (!Array.isArray(items) || items.length === 0) {
//     return res.status(400).json({ error: "Request body must be a non-empty array" });
//   }

  
//   for (const it of items) {
//     if (typeof it.user_id === "undefined" || typeof it.product_id === "undefined" || typeof it.quantity === "undefined") {
//       return res.status(400).json({ error: "Missing required fields in one or more items" });
//     }
//     const u = Number(it.user_id), p = Number(it.product_id), q = Number(it.quantity);
//     if (Number.isNaN(u) || Number.isNaN(p) || Number.isNaN(q) || q <= 0) {
//       return res.status(400).json({ error: "Invalid user_id/product_id/quantity in one or more items" });
//     }
//   }

//   const values = items.map(it => [Number(it.user_id), Number(it.product_id), Number(it.quantity)]);

//   const query = `INSERT INTO Cart_Items (user_id, product_id, quantity, added_at) VALUES ?`;

//   try {
//     await db.query(query, [values]);
//     return res.status(201).json({ message: "Cart items added successfully" });
//   } catch (err) {
//     console.error("Error adding multiple cart items:", err);
//     return res.status(500).json({ error: "Failed to add cart items" });
//   }
// };


// Add new cart item
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


// import { Request, Response } from "express";
// import db from "../config/db";
// import { CartItem } from "../models/cart.model";

// // TEMP: get user id (replace with real auth/JWT later). Accept header x-user-id.
// function getUserId(req: Request): number {
//   const raw = (req.headers["x-user-id"] as string) || (req.query.user_id as string) || "1";
//   const id = Number(raw);
//   return Number.isNaN(id) ? 1 : id;
// }

// // GET /api/cart -> current user's cart only
// export const getAllCartItems = async (req: Request, res: Response) => {
//   const user_id = getUserId(req);
//   const sql = "SELECT * FROM cart_items WHERE user_id = ? ORDER BY added_at DESC";
//   try {
//     const [rows] = await db.query<CartItem[]>(sql, [user_id]);
//     return res.status(200).json(rows);
//   } catch (err) {
//     console.error("Error fetching cart items:", err);
//     return res.status(500).json({ error: "Failed to fetch cart items" });
//   }
// };

// // GET /api/cart/:id  (by cart_item_id, still scoped by user)
// export const getCartItemById = async (req: Request, res: Response) => {
//   const id = Number(req.params.id);
//   const user_id = getUserId(req);
//   if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid cart item id" });

//   const sql = "SELECT * FROM cart_items WHERE cart_item_id = ? AND user_id = ?";
//   try {
//     const [rows] = await db.query<CartItem[]>(sql, [id, user_id]);
//     if (!rows || rows.length === 0) return res.status(404).json({ message: "Cart item not found" });
//     return res.status(200).json(rows[0]);
//   } catch (err) {
//     console.error("Error fetching cart item:", err);
//     return res.status(500).json({ error: "Failed to fetch cart item" });
//   }
// };

// // POST /api/cart { product_id, quantity } -> UPSERT (insert or increment)
// export const addCartItem = async (req: Request, res: Response) => {
//   const user_id = getUserId(req);
//   const { product_id, quantity = 1 } = req.body;

//   const qProductId = Number(product_id);
//   const qQuantity = Number(quantity);

//   if (!qProductId || Number.isNaN(qQuantity) || qQuantity <= 0) {
//     return res.status(400).json({ error: "Invalid product_id or quantity" });
//   }

//   // Uses UNIQUE (user_id, product_id) to upsert
//   const sql = `
//     INSERT INTO cart_items (user_id, product_id, quantity)
//     VALUES (?, ?, ?)
//     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), added_at = CURRENT_TIMESTAMP
//   `;
//   try {
//     const [result] = await db.query(sql, [user_id, qProductId, qQuantity]);
//     return res.status(201).json({ message: "Added to cart" });
//   } catch (err: any) {
//     // safety: if schema missing unique index, handle duplicate gracefully
//     if (err?.code === "ER_DUP_ENTRY") {
//       try {
//         const [r2] = await db.query("UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?", [qQuantity, user_id, qProductId]);
//         return res.status(200).json({ message: "Quantity increased" });
//       } catch (e2) {
//         console.error("Error updating on duplicate:", e2);
//         return res.status(500).json({ error: "Failed to update cart item" });
//       }
//     }
//     console.error("Error adding cart item:", err);
//     return res.status(500).json({ error: "Failed to add cart item" });
//   }
// };

// // PUT /api/cart/:id { quantity } -> set exact quantity
// export const updateCartItem = async (req: Request, res: Response) => {
//   const id = Number(req.params.id);
//   const user_id = getUserId(req);
//   const { quantity } = req.body;

//   if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid cart item id" });

//   const qQuantity = Number(quantity);
//   if (!qQuantity || qQuantity < 1) return res.status(400).json({ error: "quantity must be >= 1" });

//   const sql = "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ? AND user_id = ?";
//   try {
//     const [result]: any = await db.query(sql, [qQuantity, id, user_id]);
//     if (result.affectedRows === 0) return res.status(404).json({ message: "Cart item not found" });
//     return res.status(200).json({ message: "Cart item updated successfully" });
//   } catch (err) {
//     console.error("Error updating cart item:", err);
//     return res.status(500).json({ error: "Failed to update cart item" });
//   }
// };

// // DELETE /api/cart/:id
// export const deleteCartItem = async (req: Request, res: Response) => {
//   const id = Number(req.params.id);
//   const user_id = getUserId(req);
//   if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid cart item id" });

//   const sql = "DELETE FROM cart_items WHERE cart_item_id = ? AND user_id = ?";
//   try {
//     const [result]: any = await db.query(sql, [id, user_id]);
//     if (result.affectedRows === 0) return res.status(404).json({ message: "Cart item not found" });
//     return res.status(200).json({ message: "Cart item deleted successfully" });
//   } catch (err) {
//     console.error("Error deleting cart item:", err);
//     return res.status(500).json({ error: "Failed to delete cart item" });
//   }
// };

// // (Optional) DELETE /api/cart  -> clear my cart
// export const clearCart = async (req: Request, res: Response) => {
//   const user_id = getUserId(req);
//   try {
//     await db.query("DELETE FROM cart_items WHERE user_id = ?", [user_id]);
//     return res.json({ message: "Cart cleared" });
//   } catch (err) {
//     console.error("Error clearing cart:", err);
//     return res.status(500).json({ error: "Failed to clear cart" });
//   }
// };