import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import db from "../config/db";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleRegister = async (req: Request, res: Response) => {
  try {
    const { token } = req.body; // 👈 ID TOKEN (JWT)

    if (!token) {
      return res.status(400).json({ message: "Token missing" });
    }

    // ✅ Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const email = payload.email;
    const name = payload.name || "Google User";

    // 🔹 Check user
    const [rows]: any = await db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    let userId: number;

    if (rows.length === 0) {
      const [result]: any = await db.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES (?, ?, NULL, 'customer')`,
        [name, email]
      );
      userId = result.insertId;
    } else {
      userId = rows[0].user_id;
    }

    const jwtToken = jwt.sign(
      { user_id: userId, role: "customer" },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    return res.json({
      token: jwtToken,
      user: {
        user_id: userId,
        name,
        email,
        role: "customer"
      }
    });

  } catch (err) {
    console.error("GOOGLE AUTH ERROR:", err);
    return res.status(500).json({ message: "Google auth failed" });
  }
};
