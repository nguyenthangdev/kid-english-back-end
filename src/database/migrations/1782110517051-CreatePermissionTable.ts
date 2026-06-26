import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissionTable1782110517051 implements MigrationInterface {
  name = 'CreatePermissionTable1782110517051';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."permissions_module_enum" AS ENUM('VOCABULARY', 'QUOTE', 'USER', 'SYSTEM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."permissions_action_enum" AS ENUM('CREATE', 'READ', 'UPDATE', 'DELETE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "module" "public"."permissions_module_enum" NOT NULL, "action" "public"."permissions_action_enum" NOT NULL, "code" character varying NOT NULL, "description" character varying, "is_deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8dad765629e83229da6feda1c1d" UNIQUE ("code"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TYPE "public"."permissions_action_enum"`);
    await queryRunner.query(`DROP TYPE "public"."permissions_module_enum"`);
  }
}
