import { Request, Response } from "express";
import db from "../config/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/email.service";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // 1️⃣ Validate
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "name, email, password are required"
      });
    }

    // 2️⃣ Check existing user
    const [existing]: any = await db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    // 3️⃣ Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 4️⃣ Insert user
    const [result]: any = await db.query(
      `INSERT INTO users 
       (name, email, password_hash, phone, address, role, EmailConfirmed)
       VALUES (?, ?, ?, ?, ?, 'customer', 0)`,
      [name, email, password_hash, phone || null, address || null]
    );

    const userId = result.insertId;

    // 5️⃣ Create verification token
    const token = crypto.randomBytes(32).toString("hex");

    await db.query(
      `INSERT INTO email_verification_tokens 
       (user_id, token, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))`,
      [userId, token]
    );

    const confirmUrl = `${process.env.FRONTEND_URL}/confirm-email?token=${token}`;

    // 6️⃣ Respond immediately (FAST UX)
    res.status(201).json({
      message: "Registration successful. Please check your email to verify.",
      user_id: userId
    });

    // 7️⃣ Send email using RESEND (NON-BLOCKING)
    sendVerificationEmail(email, confirmUrl)
      .then(() => {
        console.log("Verification email sent:", email);
      })
      .catch(err => {
        console.error("EMAIL SEND ERROR:", err);
      });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({
      message: "Server Error"
    });
  }
};
