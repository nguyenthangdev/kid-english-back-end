import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Quote } from './quote.entity';

@Entity('daily_quotes')
@Unique('UQ_DAILY_QUOTE_DATE', ['date'])
export class DailyQuote extends BaseEntity {
  @Index()
  @Column({ name: 'quote_id', type: 'uuid' })
  quoteId: string;

  @Column({ type: 'date' })
  date: string; // ISO date string: YYYY-MM-DD

  @ManyToOne(() => Quote)
  @JoinColumn({ name: 'quote_id' })
  quote: Quote;
}
