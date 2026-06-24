import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Bearer Auth Guard for the user-facing app (STUDENT / TEACHER).
 *
 * Uses the 'jwt-user' Passport strategy which:
 *   - Reads Authorization: Bearer <token> header
 *   - Verifies with JWT_ACCESS_TOKEN_SECRET_USER
 *   - Rejects ADMIN accounts
 *
 * After this guard runs, `request.user` is populated with
 * `AuthenticatedUser` (id, email, roleId, roleCode).
 *
 * Usage:
 *   @UseGuards(JwtUserAuthGuard)
 *   @Get('protected-route')
 *   myHandler(@CurrentUser() user: AuthenticatedUser) { ... }
 */
@Injectable()
export class JwtUserAuthGuard extends AuthGuard('jwt-user') {}
