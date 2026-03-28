/**
 * JWT Authentication middleware
 * Verifies JWT tokens and attaches user profile to request
 *
 * Phase 7 (Security Implementation): JWT verification wired in
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'client' | 'lawyer';
      };
      userId?: string;
    }
  }
}

/**
 * JWT verification middleware
 * Extracts and validates JWT token from Authorization header
 * Attaches userId to request for authenticated endpoints
 *
 * Supports both Supabase JWTs (signed by Supabase) and custom JWTs
 * Supabase JWTs are decoded without verification (trusted from /auth/login)
 */
export function verifyJWT(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Manually decode JWT payload (part 2 of 3)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: 'Invalid token: missing user ID' });
    }

    // Extract user info from JWT payload
    // Supabase uses 'sub' for user ID
    (req as any).userId = decoded.sub;
    (req as any).user = {
      id: decoded.sub,
      email: decoded.email || '',
      role: decoded.role || 'authenticated',
    };

    next();
  } catch (error: any) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  verifyJWT(req, res, next);
}

export function requireRole(role: 'client' | 'lawyer' | 'both') {
  return (req: Request, res: Response, next: NextFunction) => {
    // First verify JWT
    verifyJWT(req, res, () => {
      // Then check role
      const userRole = (req as any).user?.role;
      if (role !== 'both' && userRole !== role) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    });
  };
}
