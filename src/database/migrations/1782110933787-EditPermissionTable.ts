import { MigrationInterface, QueryRunner } from "typeorm";

export class EditPermissionTable1782110933787 implements MigrationInterface {
    name = 'EditPermissionTable1782110933787'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TYPE "public"."permissions_module_enum" RENAME TO "permissions_module_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."permissions_module_enum" AS ENUM('VOCABULARY', 'QUOTE', 'USER')`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "module" TYPE "public"."permissions_module_enum" USING "module"::"text"::"public"."permissions_module_enum"`);
        await queryRunner.query(`DROP TYPE "public"."permissions_module_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."permissions_module_enum_old" AS ENUM('VOCABULARY', 'QUOTE', 'USER', 'SYSTEM')`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "module" TYPE "public"."permissions_module_enum_old" USING "module"::"text"::"public"."permissions_module_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."permissions_module_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."permissions_module_enum_old" RENAME TO "permissions_module_enum"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

}
