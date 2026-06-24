import { Request } from 'express';

/**
 * Shape of the authenticated user attached to request.user
 * after JwtUserAuthGuard verifies the Bearer token via JwtUserStrategy.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  roleId: string;
  roleCode: string;
}

/**
 * Extended Express Request type for user-authenticated endpoints.
 */
export interface UserRequest extends Request {
  user?: AuthenticatedUser;
}
