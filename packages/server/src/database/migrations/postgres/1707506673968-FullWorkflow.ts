import { MigrationInterface, QueryRunner } from 'typeorm'

export class FullWorkflow1707506673968 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS execution (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "shortId" varchar NOT NULL,
                "workflowShortId" varchar NOT NULL,
                "name" varchar NOT NULL,
                "state" varchar NOT NULL,
                "executionData" text NOT NULL,
                deployed bool NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "stoppedDate" timestamp NULL,
                CONSTRAINT "PK_3c7cea7d047ac4b9176457wf2" PRIMARY KEY (id)
            );`
        )
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS webhook (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nodeId" varchar NOT NULL,
                "webhookEndpoint" varchar NOT NULL,
                "httpMethod" text NOT NULL,
                "workflowShortId" varchar NOT NULL,
                "webhookId" varchar NOT NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3c7cea7d047ac4b9176457wf3" PRIMARY KEY (id)
            );`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE execution`)
        await queryRunner.query(`DROP TABLE webhook`)
    }
}
