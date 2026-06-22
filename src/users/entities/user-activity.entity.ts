import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from './user.entity';
import { ActiveType, TargetType } from '../../common/constants/enums';

@Entity('user_activity')
export class UserActivity extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'active_type', type: 'enum', enum: ActiveType })
  activeType: ActiveType;

  // Chỉnh sửa chuẩn production: Type lưu loại entity, ID lưu UUID thực tế (Nullable nếu type là NONE)
  @Column({
    name: 'target_type',
    type: 'enum',
    enum: TargetType,
    default: TargetType.NONE,
  })
  targetType: TargetType;

  @Index()
  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  targetId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
