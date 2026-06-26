import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import {
  PermissionModule,
  PermissionAction,
} from '../../common/constants/enums';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ type: 'enum', enum: PermissionModule })
  module: PermissionModule;

  @Column({ type: 'enum', enum: PermissionAction })
  action: PermissionAction;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;
}
