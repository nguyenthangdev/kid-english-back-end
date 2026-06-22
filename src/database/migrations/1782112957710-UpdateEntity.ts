import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEntity1782112957710 implements MigrationInterface {
    name = 'UpdateEntity1782112957710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vocabularies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "tag_id" uuid NOT NULL, "word" character varying NOT NULL, "pronunciation" character varying, "meaning" character varying NOT NULL, "image_url" character varying, "is_deleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_1f0c8d5539ccaf456ebf73cabb5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9fb9e8f942e752a7dae3ac8d4c" ON "vocabularies"  ("tag_id") `);
        await queryRunner.query(`CREATE TYPE "public"."tags_type_enum" AS ENUM('VOCAB', 'QUOTE')`);
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "color_code" character varying, "type" "public"."tags_type_enum" NOT NULL, "thumbnail_url" character varying, CONSTRAINT "UQ_b3aa10c29ea4e61a830362bd25a" UNIQUE ("slug"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "quotes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "tag_id" uuid NOT NULL, "content_en" text NOT NULL, "content_vn" text NOT NULL, "author" character varying, "audio_url" character varying, "is_deleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_99a0e8bcbcd8719d3a41f23c263" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5941c379dcf1236f6523a4d14a" ON "quotes"  ("tag_id") `);
        await queryRunner.query(`CREATE TABLE "user_streaks" ("user_id" uuid NOT NULL, "current_streak" integer NOT NULL DEFAULT '0', "last_active_date" date, "highest_streak" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_91fc9bfd912d8ce3ae4be2ea193" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_vocabulary_progress_status_enum" AS ENUM('LEARNING', 'MASTERED')`);
        await queryRunner.query(`CREATE TABLE "user_vocabulary_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "vocabulary_id" uuid NOT NULL, "status" "public"."user_vocabulary_progress_status_enum" NOT NULL DEFAULT 'LEARNING', CONSTRAINT "UQ_USER_VOCABULARY" UNIQUE ("user_id", "vocabulary_id"), CONSTRAINT "PK_1a8ca2862526c9ec009b65e499c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7cceeefa847caf410e3c79a66a" ON "user_vocabulary_progress"  ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_96188b677e634541bf8545cac9" ON "user_vocabulary_progress"  ("vocabulary_id") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "full_name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "avatar_url" character varying, "is_active" boolean NOT NULL DEFAULT true, "is_deleted" boolean NOT NULL DEFAULT false, "role_id" uuid NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"  ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."user_activity_active_type_enum" AS ENUM('LOGIN', 'LEARN_FLASHCARD', 'READ_QUOTE')`);
        await queryRunner.query(`CREATE TYPE "public"."user_activity_target_type_enum" AS ENUM('VOCABULARY', 'QUOTE', 'TAG', 'NONE')`);
        await queryRunner.query(`CREATE TABLE "user_activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "active_type" "public"."user_activity_active_type_enum" NOT NULL, "target_type" "public"."user_activity_target_type_enum" NOT NULL DEFAULT 'NONE', "target_id" uuid, CONSTRAINT "PK_daec6d19443689bda7d7785dff5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_11108754ec780c670440e32baa" ON "user_activity"  ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4f6084d8f05f79aac2f72b4ed0" ON "user_activity"  ("target_id") `);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions"  ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions"  ("permission_id") `);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "code" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "vocabularies" ADD CONSTRAINT "FK_9fb9e8f942e752a7dae3ac8d4c7" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quotes" ADD CONSTRAINT "FK_5941c379dcf1236f6523a4d14a5" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_streaks" ADD CONSTRAINT "FK_91fc9bfd912d8ce3ae4be2ea193" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "FK_7cceeefa847caf410e3c79a66af" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "FK_96188b677e634541bf8545cac9e" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_activity" ADD CONSTRAINT "FK_11108754ec780c670440e32baad" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`ALTER TABLE "user_activity" DROP CONSTRAINT "FK_11108754ec780c670440e32baad"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
        await queryRunner.query(`ALTER TABLE "user_vocabulary_progress" DROP CONSTRAINT "FK_96188b677e634541bf8545cac9e"`);
        await queryRunner.query(`ALTER TABLE "user_vocabulary_progress" DROP CONSTRAINT "FK_7cceeefa847caf410e3c79a66af"`);
        await queryRunner.query(`ALTER TABLE "user_streaks" DROP CONSTRAINT "FK_91fc9bfd912d8ce3ae4be2ea193"`);
        await queryRunner.query(`ALTER TABLE "quotes" DROP CONSTRAINT "FK_5941c379dcf1236f6523a4d14a5"`);
        await queryRunner.query(`ALTER TABLE "vocabularies" DROP CONSTRAINT "FK_9fb9e8f942e752a7dae3ac8d4c7"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "code" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f6084d8f05f79aac2f72b4ed0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11108754ec780c670440e32baa"`);
        await queryRunner.query(`DROP TABLE "user_activity"`);
        await queryRunner.query(`DROP TYPE "public"."user_activity_target_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_activity_active_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_96188b677e634541bf8545cac9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7cceeefa847caf410e3c79a66a"`);
        await queryRunner.query(`DROP TABLE "user_vocabulary_progress"`);
        await queryRunner.query(`DROP TYPE "public"."user_vocabulary_progress_status_enum"`);
        await queryRunner.query(`DROP TABLE "user_streaks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5941c379dcf1236f6523a4d14a"`);
        await queryRunner.query(`DROP TABLE "quotes"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP TYPE "public"."tags_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9fb9e8f942e752a7dae3ac8d4c"`);
        await queryRunner.query(`DROP TABLE "vocabularies"`);
    }

}
