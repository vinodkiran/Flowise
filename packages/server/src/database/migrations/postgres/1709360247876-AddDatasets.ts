import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDatasets1709360247876 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS dataset (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "type" text NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_98419043dd804f54-9830ab99f8" PRIMARY KEY (id)
            );`
        )
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS dataset_row (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                datasetId uuid NOT NULL DEFAULT uuid_generate_v4(),
                "input" varchar NOT NULL,
                "output" text NULL,
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_98909027dd804f54-9840ab99f8" PRIMARY KEY (id)
            );`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE dataset`)
        await queryRunner.query(`DROP TABLE dataset_row`)
    }
}