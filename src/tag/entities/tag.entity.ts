import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { TagType } from '../../common/constants/enums';
import { Vocabulary } from '../../vocabulary/entities/vocabulary.entity';
import { Quote } from '../../quotes/entities/quote.entity';

@Entity('tags')
export class Tag extends BaseEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ name: 'color_code', type: 'varchar', nullable: true })
  colorCode: string;

  @Column({ type: 'enum', enum: TagType })
  type: TagType;

  @Column({ name: 'thumbnail_url', type: 'varchar', nullable: true })
  thumbnailUrl: string;

  @OneToMany(() => Vocabulary, (vocab) => vocab.tag)
  vocabularies: Vocabulary[];

  @OneToMany(() => Quote, (quote) => quote.tag)
  quotes: Quote[];

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;
}
