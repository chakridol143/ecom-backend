import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const adminLogin = (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (email !== "nallaravikishore@gmail.com" || password !== "Ravi_@123") {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

    if (!secret) {
      console.error("❌ ADMIN_JWT_SECRET is missing in Railway");
      return res.status(500).json({ message: "Server misconfiguration: No admin secret" });
    }

    const token = jwt.sign(
      { role: "admin", user_id: 1 },
      secret,
      { expiresIn: "1d" }
    );

    return res.json({ message: "Admin login successful", token });
  }
  catch (err: any) {
    console.error("ADMIN LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
