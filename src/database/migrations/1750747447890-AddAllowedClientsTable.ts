import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAllowedClientsTable1750747447890 implements MigrationInterface {
  name = 'AddAllowedClientsTable1750747447890'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "allowed_clients" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "client_uuid" uuid NOT NULL, "client_type" character varying(50) NOT NULL, "client_description" text, "is_active" boolean NOT NULL DEFAULT true, "ip" character varying, "last_seen_at" TIMESTAMP, CONSTRAINT "UQ_46130b534e5e257324baaa7e636" UNIQUE ("client_uuid"), CONSTRAINT "PK_e3ddd6ee5e102734f693a258aed" PRIMARY KEY ("id")); COMMENT ON COLUMN "allowed_clients"."created_at" IS 'Record creation date'; COMMENT ON COLUMN "allowed_clients"."updated_at" IS 'Record last update date'; COMMENT ON COLUMN "allowed_clients"."client_uuid" IS 'Unique client UUID identifier'; COMMENT ON COLUMN "allowed_clients"."client_type" IS 'Type of client (browser, mobile_app, desktop_app, etc.)'; COMMENT ON COLUMN "allowed_clients"."client_description" IS 'Optional description of the client'; COMMENT ON COLUMN "allowed_clients"."is_active" IS 'Indicates if the client is active and allowed'; COMMENT ON COLUMN "allowed_clients"."ip" IS 'IP address of the client'; COMMENT ON COLUMN "allowed_clients"."last_seen_at" IS 'Last time this client was seen active'`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_46130b534e5e257324baaa7e63" ON "allowed_clients" ("client_uuid") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_46130b534e5e257324baaa7e63"`)
    await queryRunner.query(`DROP TABLE "allowed_clients"`)
  }
}
