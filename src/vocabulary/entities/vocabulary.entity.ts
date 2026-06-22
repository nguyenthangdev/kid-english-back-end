import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tag } from '../../tag/entities/tag.entity';

@Entity('vocabularies')
export class Vocabulary extends BaseEntity {
  @Index()
  @Column({ name: 'tag_id', type: 'uuid' })
  tagId: string;

  @Column({ type: 'varchar' })
  word: string;

  @Column({ type: 'varchar', nullable: true })
  pronunciation: string;

  @Column({ type: 'varchar' })
  meaning: string;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @ManyToOne(() => Tag, (tag) => tag.vocabularies)
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
