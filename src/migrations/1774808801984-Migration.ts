import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1774808801984 implements MigrationInterface {
  name = 'Migration1774808801984';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "eventId" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "source" character varying NOT NULL, "funnelStage" character varying NOT NULL, "eventType" character varying NOT NULL, "data" jsonb NOT NULL, CONSTRAINT "UQ_7314b1631c199d4b49d1bcb98fd" UNIQUE ("eventId"), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6fa767b077824b360b1f999688" ON "events" ("timestamp", "source") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6fa767b077824b360b1f999688"`,
    );
    await queryRunner.query(`DROP TABLE "events"`);
  }
}
