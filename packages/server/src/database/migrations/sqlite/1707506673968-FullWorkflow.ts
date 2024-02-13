import { MigrationInterface, QueryRunner } from 'typeorm'

export class FullWorkflow1707506673968 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "execution" (
                "id" varchar PRIMARY KEY NOT NULL, 
                "shortId" varchar NOT NULL, 
                "workflowShortId" varchar NOT NULL, 
                "state" varchar NOT NULL, 
                "executionData" text NOT NULL, 
                "deployed" boolean, 
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')), 
                "stoppedDate" datetime NULL);`
        )
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "webhook" (
                "id" varchar PRIMARY KEY NOT NULL, 
                "nodeId" varchar NOT NULL, 
                "webhookEndpoint" varchar NOT NULL, 
                "httpMethod" varchar NOT NULL, 
                "workflowShortId" varchar NOT NULL, 
                "webhookId" varchar NULL, 
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')), 
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')));`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE execution`)
        await queryRunner.query(`DROP TABLE webhook`)
    }
}
