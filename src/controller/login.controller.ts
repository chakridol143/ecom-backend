import { Request, Response } from "express";
import db from "../config/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const [rows]: any = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Compare bcrypt hash correctly
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    return res.json({ message: "Login Successful", token, user });

  } catch (error: any) {
    console.log("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};
