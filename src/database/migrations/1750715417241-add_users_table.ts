import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUsersTable1750715417241 implements MigrationInterface {
  name = 'AddUsersTable1750715417241'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin', 'superadmin')`)
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "name" character varying(100) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "email_verification_token" character varying(255), "email_verified_at" TIMESTAMP, "password_reset_token" character varying(255), "password_reset_expires_at" TIMESTAMP, "last_login_at" TIMESTAMP, "login_attempts" integer NOT NULL DEFAULT '0', "locked_until" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")); COMMENT ON COLUMN "users"."created_at" IS 'Record creation date'; COMMENT ON COLUMN "users"."updated_at" IS 'Record last update date'; COMMENT ON COLUMN "users"."email" IS 'Unique user email'; COMMENT ON COLUMN "users"."password" IS 'User hashed password'; COMMENT ON COLUMN "users"."name" IS 'User full name'; COMMENT ON COLUMN "users"."is_active" IS 'Indicates if the user is active'; COMMENT ON COLUMN "users"."role" IS 'User role in the system'; COMMENT ON COLUMN "users"."email_verification_token" IS 'Token for email verification'; COMMENT ON COLUMN "users"."email_verified_at" IS 'Email verification date'; COMMENT ON COLUMN "users"."password_reset_token" IS 'Token for password reset'; COMMENT ON COLUMN "users"."password_reset_expires_at" IS 'Password reset token expiry date'; COMMENT ON COLUMN "users"."last_login_at" IS 'User last login date'; COMMENT ON COLUMN "users"."login_attempts" IS 'Failed login attempts count'; COMMENT ON COLUMN "users"."locked_until" IS 'Account locked until this date'`,
    )
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`)
    await queryRunner.query(`DROP TABLE "users"`)
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`)
  }
}
