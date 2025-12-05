import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'changeme';

export default {
  ensureAdmin: (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const payload = jwt.verify(token, ADMIN_SECRET) as any;

      if (!payload?.role || payload.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      (req as any).user = payload;
      next();

    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
};
