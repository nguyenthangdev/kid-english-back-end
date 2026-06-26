import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  PERMISSIONS_KEY,
  RequiredPermission,
} from '../decorators/permissions.decorator';
import { Permission } from '../../permissions/entities/permission.entity';

interface RequestUser {
  id: string;
  role?: {
    permissions?: Permission[];
  };
}

/**
 * Guard that checks whether the authenticated user's role has all
 * permissions required by the @Permissions() decorator on the route.
 *
 * Must be used together with JwtAuthGuard (applied first).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      RequiredPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // No @Permissions() decorator → route is accessible to any authenticated user
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: RequestUser }>();
    const user = request.user;

    if (!user?.role?.permissions) {
      throw new ForbiddenException('Access denied: no role permissions found');
    }

    const userPermissionCodes = new Set(
      user.role.permissions.map((p) => `${p.module}:${p.action}`),
    );

    const hasAll = requiredPermissions.every((required) =>
      userPermissionCodes.has(`${required.module}:${required.action}`),
    );

    if (!hasAll) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    return true;
  }
}
