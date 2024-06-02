import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitWorkflow1717306541478 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          `CREATE TABLE IF NOT EXISTS \`work_flow\` (
                \`id\` varchar(36) NOT NULL,
                \`shortid\` varchar(255) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`flowData\` text NOT NULL,
                \`deployed\` tinyint DEFAULT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE work_flow`)
    }
}