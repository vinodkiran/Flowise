import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDatasets1709360247876 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`dataset\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`type\` varchar(255) DEFAULT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
        )
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`dataset_row\` (
                \`id\` varchar(36) NOT NULL,
                \`datasetId\` varchar(36) NOT NULL,
                \`input\` varchar(255) NOT NULL,
                \`output\` varchar(255) DEFAULT NULL,
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE dataset`)
        await queryRunner.query(`DROP TABLE dataset_row`)
    }
}