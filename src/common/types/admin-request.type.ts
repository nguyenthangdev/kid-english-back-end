import { Request } from 'express';
import { User } from '../../users/entities/user.entity';
import {
  PermissionModule,
  PermissionAction,
} from '../../common/constants/enums';

export interface SerializedRole {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: {
    id: string;
    module: PermissionModule | string;
    action: PermissionAction | string;
    code: string;
    description: string;
  }[];
}

export interface AdminRequest extends Request {
  accountAdmin?: Partial<User>;
  accountAdminRole?: SerializedRole;
}
