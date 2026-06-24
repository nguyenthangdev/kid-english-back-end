import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSearchTextToVoCab1782293520776 implements MigrationInterface {
    name = 'AddSearchTextToVoCab1782293520776'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vocabularies" ADD "search_text" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vocabularies" DROP COLUMN "search_text"`);
    }

}
