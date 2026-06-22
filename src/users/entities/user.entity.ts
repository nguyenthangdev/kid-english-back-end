import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '../../roles/entities/role.entity';
import { UserStreak } from './user-streak.entity';
import { UserVocabularyProgress } from './user-vocabulary-progress.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ name: 'full_name', type: 'varchar' })
  fullName: string;

  @Index()
  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  // Relational FK
  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToOne(() => UserStreak, (streak) => streak.user, { cascade: true })
  streak: UserStreak;

  @OneToMany(() => UserVocabularyProgress, (progress) => progress.user)
  vocabularyProgresses!: UserVocabularyProgress[];
}
