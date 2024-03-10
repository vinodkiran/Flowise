import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEvaluation1709608791567 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS evaluation (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "chatflowId" varchar NOT NULL,
                "chatflowName" varchar NOT NULL,
                "datasetId" varchar NOT NULL,
                "datasetName" varchar NOT NULL,
                "evaluationType" varchar NOT NULL,
                "status" varchar NOT NULL,
                "metrics" text NULL,
                "runDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_98989043dd804f54-9830ab99f8" PRIMARY KEY (id)
            );`
        )
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS evaluation_run (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                evaluationId varchar NOT NULL DEFAULT,
                "input" text NOT NULL,
                "expectedOutput" text NULL,
                "actualOutput" text NULL,
                "reasoning" TEXT DEFAULT NULL,
                "score" integer DEFAULT 0,
                "metrics" text NULL,
                "runDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_98989927dd804f54-9840ab23f8" PRIMARY KEY (id)
            );`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE evaluation`)
        await queryRunner.query(`DROP TABLE evaluation_run`)
    }
}
