import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVersionColumnToRoleTable1782444814755 implements MigrationInterface {
  name = 'AddVersionColumnToRoleTable1782444814755';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "version" integer NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "version"`);
  }
}
