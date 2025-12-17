import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import db from "../config/db";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleRegister = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token missing" });
    }

    // 🔹 Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const email = payload.email;
    const name = payload.name;

    if (!email || !name) {
      return res.status(400).json({ message: "Google data incomplete" });
    }

    // 🔹 Check existing user
    const [rows]: any = await db.query(
      "SELECT user_id, name, email, role FROM users WHERE email = ?",
      [email]
    );

    let userId: number;

    if (rows.length === 0) {
      // 🔹 Create new Google user (NO PASSWORD)
      const [result]: any = await db.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES (?, ?, NULL, 'customer')`,
        [name, email]
      );

      userId = result.insertId;
    } else {
      userId = rows[0].user_id;
    }

    // 🔹 Create JWT
    const jwtToken = jwt.sign(
      { user_id: userId, role: "customer" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    // 🔹 Send response
    return res.json({
      message: "Google login successful",
      token: jwtToken,
      user: {
        user_id: userId,
        name,
        email,
        role: "customer",
      },
    });

  } catch (error) {
    console.error("GOOGLE AUTH ERROR:", error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};
