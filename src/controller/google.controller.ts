import { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Authorization code missing" });
    }

    // EXCHANGE AUTH CODE FOR TOKENS
    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || "postmessage",
        grant_type: "authorization_code",
      }
    );

    const { id_token } = tokenRes.data;

    // DECODE GOOGLE JWT TO GET USER INFO
    const base64 = id_token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(base64, "base64").toString());

    const email = decoded.email;
    const name = decoded.name;
    const picture = decoded.picture;
    const googleId = decoded.sub;

    // FIND OR CREATE USER IN DB
    // -----------------------------------
    // Replace with your MySQL queries (User model)
    // Example mock:
    const user = {
      id: googleId,
      email,
      name,
      picture,
    };

    // CREATE YOUR OWN JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user,
    });

  } catch (err: any) {
    console.error(err.response?.data || err);
    return res.status(500).json({
      message: "Google authentication failed",
      error: err.response?.data || err,
    });
  }
};
