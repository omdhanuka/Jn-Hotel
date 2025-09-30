import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const adminAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};
