import { AuthUser } from './auth-user.type';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionToken?: string;
      requestId?: string;
      sessionTransport?: 'cookie' | 'header';
    }
  }
}

export {};
