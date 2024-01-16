import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitWorkflow1705144242067 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "work_flow" ("id" varchar PRIMARY KEY NOT NULL, "shortid" varchar NOT NULL, "name" varchar NOT NULL, "flowData" text NOT NULL, "deployed" boolean, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "updatedDate" datetime NOT NULL DEFAULT (datetime('now')));`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE work_flow`)
    }
}
