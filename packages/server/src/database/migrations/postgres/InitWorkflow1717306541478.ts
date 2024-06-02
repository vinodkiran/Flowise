import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitWorkflow1717306541478 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          `CREATE TABLE IF NOT EXISTS work_flow (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "shortid" varchar NOT NULL,
                "name" varchar NOT NULL,
                "flowData" text NOT NULL,
                deployed bool NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3c7cea7d047ac4b91764578wf" PRIMARY KEY (id)
            );`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE work_flow`)
    }
}