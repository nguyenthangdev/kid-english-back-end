import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ProgressStatus } from '../../common/constants/enums';
import { Vocabulary } from '../../vocabulary/entities/vocabulary.entity';

@Entity('user_vocabulary_progress')
@Unique('UQ_USER_VOCABULARY', ['userId', 'vocabularyId'])
export class UserVocabularyProgress extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index()
  @Column({ name: 'vocabulary_id', type: 'uuid' })
  vocabularyId: string;

  @Column({
    type: 'enum',
    enum: ProgressStatus,
    default: ProgressStatus.LEARNING,
  })
  status: ProgressStatus;

  @ManyToOne(() => User, (user) => user.vocabularyProgresses)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Vocabulary)
  @JoinColumn({ name: 'vocabulary_id' })
  vocabulary: Vocabulary;
}
