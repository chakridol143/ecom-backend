import { Request, Response } from "express";
import db from "../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Check duplicate email
    const [existing]: any = await db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const [result]: any = await db.query(
      `INSERT INTO users (name, email, password_hash, phone, address, role)
       VALUES (?, ?, ?, ?, ?, 'customer')`,
      [name, email, password_hash, phone ?? null, address ?? null]
    );

    // Ensure JWT secret exists
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in environment variables");
    }

    // Generate token
    const token = jwt.sign(
      { user_id: result.insertId, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      message: "Registration successful",
      user: {
        user_id: result.insertId,
        name,
        email,
        phone,
        address,
        role: "customer"
      },
      token
    });
  } catch (err: any) {
    console.error("REGISTER ERROR:", err.message || err);
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};
