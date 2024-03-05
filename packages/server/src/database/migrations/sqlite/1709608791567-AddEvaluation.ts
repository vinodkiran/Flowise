import { MigrationInterface, QueryRunner } from 'typeorm'

/*
export interface IEvaluation {
    id: string
    name: string
    chatflowId: string
    chatflowName: string
    datasetId: string
    datasetName: string
    evaluationType: string
    average_metrics: string
    status: string
    runDate: Date
}

export interface IEvaluationRun {
    id: string
    evaluationId: string
    input: string
    expectedOutput: string
    actualOutput: string
    metrics: string
    runDate: Date
}
 */
export class AddEvaluation1709608791567 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "evaluation" (
"id" varchar PRIMARY KEY NOT NULL, 
"name" varchar NOT NULL, 
"chatflowId" varchar NOT NULL, 
"chatflowName" varchar NOT NULL, 
"datasetId" varchar NOT NULL, 
"datasetName" varchar NOT NULL, 
"status" varchar NOT NULL, 
"evaluationType" varchar, 
"average_metrics" text, 
"runDate" datetime NOT NULL DEFAULT (datetime('now')));`
        )
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "evaluation_run" (
"id" varchar PRIMARY KEY NOT NULL, 
"evaluationId" text NOT NULL, 
"input" text NOT NULL, 
"expectedOutput" text NOT NULL, 
"actualOutput" text NOT NULL, 
"metrics" text NOT NULL, 
"runDate" datetime NOT NULL DEFAULT (datetime('now')));`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE evaluation`)
        await queryRunner.query(`DROP TABLE evaluation_run`)
    }
}
