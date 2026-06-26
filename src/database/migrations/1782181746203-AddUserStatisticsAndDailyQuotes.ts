import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserStatisticsAndDailyQuotes1782181746203 implements MigrationInterface {
  name = 'AddUserStatisticsAndDailyQuotes1782181746203';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "daily_quotes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "quote_id" uuid NOT NULL, "date" date NOT NULL, CONSTRAINT "UQ_DAILY_QUOTE_DATE" UNIQUE ("date"), CONSTRAINT "PK_3ad21c39bfac31432b2c1baa0af" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e0821ab56c313e3c1b4fd5819f" ON "daily_quotes"  ("quote_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_statistics" ("user_id" uuid NOT NULL, "total_stars" integer NOT NULL DEFAULT '0', "total_words_learned" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6c4dc06468a467954bfe446ebdd" PRIMARY KEY ("user_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_quotes" ADD CONSTRAINT "FK_e0821ab56c313e3c1b4fd5819fe" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_statistics" ADD CONSTRAINT "FK_6c4dc06468a467954bfe446ebdd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_statistics" DROP CONSTRAINT "FK_6c4dc06468a467954bfe446ebdd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_quotes" DROP CONSTRAINT "FK_e0821ab56c313e3c1b4fd5819fe"`,
    );
    await queryRunner.query(`DROP TABLE "user_statistics"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e0821ab56c313e3c1b4fd5819f"`,
    );
    await queryRunner.query(`DROP TABLE "daily_quotes"`);
  }
}
