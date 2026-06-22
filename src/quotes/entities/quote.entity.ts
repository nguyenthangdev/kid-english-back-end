import { Tag } from '../../tag/entities/tag.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('quotes')
export class Quote extends BaseEntity {
  @Index()
  @Column({ name: 'tag_id', type: 'uuid' })
  tagId: string;

  @Column({ name: 'content_en', type: 'text' })
  contentEn: string;

  @Column({ name: 'content_vn', type: 'text' })
  contentVn: string;

  @Column({ type: 'varchar', nullable: true })
  author: string;

  @Column({ name: 'audio_url', type: 'varchar', nullable: true })
  audioUrl: string;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @ManyToOne(() => Tag, (tag) => tag.quotes)
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
