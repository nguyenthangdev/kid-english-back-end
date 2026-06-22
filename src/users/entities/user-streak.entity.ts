import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_streaks')
export class UserStreak {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'current_streak', type: 'int', default: 0 })
  currentStreak: number;

  @Column({ name: 'last_active_date', type: 'date', nullable: true })
  lastActiveDate: Date;

  @Column({ name: 'highest_streak', type: 'int', default: 0 })
  highestStreak: number;

  @OneToOne(() => User, (user) => user.streak)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
