import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSearchTextToRole1782381821630 implements MigrationInterface {
    name = 'AddSearchTextToRole1782381821630'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" ADD "search_text" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "search_text"`);
    }

}
