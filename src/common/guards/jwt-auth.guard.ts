import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Standard JWT Bearer Auth Guard.
 *
 * Apply this guard on any route that requires the user to be
 * authenticated via a Bearer token in the Authorization header.
 *
 * After this guard runs, `request.user` is populated with
 * `RequestUserContext` (id, email, roleId, role).
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('protected-route')
 *   myHandler(@CurrentUser() user: RequestUserContext) { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
