

import { Request, Response } from "express";
import db from "../config/db";
import { Order } from "../models/checkout_order.model";
import { ResultSetHeader } from "mysql2";

export const checkout = async (req: Request, res: Response) => {
  try {
    const { user_id, total_amount, shipping_id, items } = req.body;

    if (!user_id || !total_amount || !items || items.length === 0) {
      return res.status(400).json({ message: "Missing order details" });
    }

    const order: Order = {
      user_id,
      status: "Pending",
      total_amount,
      shipping_id,
    };

    
    const orderQuery = `
      INSERT INTO orders (user_id, status, total_amount, shipping_id)
      VALUES (?, ?, ?, ?)
    `;

    const [orderResult] = await db.query<ResultSetHeader>(
      orderQuery,
      [order.user_id, order.status, order.total_amount, order.shipping_id]
    );

    const order_id = orderResult.insertId;

    //  Prepare order items
    const orderItemsValues = items.map((item: any) => [
      order_id,
      item.product_id,
      item.quantity,
      item.price,
    ]);

    const itemQuery = `
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES ?
    `;

    await db.query(itemQuery, [orderItemsValues]);

    return res.status(200).json({
      message: "Order placed successfully",
      order_id,
    });
  } catch (error) {
    console.error(" Checkout error:", error);
    return res.status(500).json({ message: "Server error during checkout" });
  }
};
