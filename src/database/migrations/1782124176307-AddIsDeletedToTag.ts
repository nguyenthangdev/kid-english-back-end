import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsDeletedToTag1782124176307 implements MigrationInterface {
  name = 'AddIsDeletedToTag1782124176307';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tags" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "is_deleted"`);
  }
}
