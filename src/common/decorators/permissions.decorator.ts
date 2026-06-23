import { SetMetadata } from '@nestjs/common';
import { PermissionAction, PermissionModule } from '../constants/enums';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  module: PermissionModule;
  action: PermissionAction;
}

/**
 * Decorator to specify required permissions for a route.
 * Example: @Permissions({ module: PermissionModule.VOCABULARY, action: PermissionAction.CREATE })
 */
export const Permissions = (
  ...permissions: RequiredPermission[]
): MethodDecorator => SetMetadata(PERMISSIONS_KEY, permissions);
