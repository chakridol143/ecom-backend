import { Request, Response } from "express";
import db from "../config/db";

export const confirmEmail = async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) return res.status(400).json({ message: "Token missing" });

  const [rows]: any = await db.query(
    `SELECT user_id FROM email_verification_tokens 
     WHERE token = ? AND expires_at > NOW()`,
    [token]
  );

  if (!rows.length) return res.status(400).json({ message: "Invalid or expired token" });

  const userId = rows[0].user_id;

  await db.query(`UPDATE users SET EmailConfirmed = 1 WHERE user_id = ?`, [userId]);

  await db.query(`DELETE FROM email_verification_tokens WHERE user_id = ?`, [userId]);

  return res.json({ message: "Email verified successfully" });
};
