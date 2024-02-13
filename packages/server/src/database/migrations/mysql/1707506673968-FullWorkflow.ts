import { MigrationInterface, QueryRunner } from 'typeorm'

export class FullWorkflow1707506673968 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`execution\` (
                \`id\` varchar(36) NOT NULL,
                \`shortId\` varchar(255) NOT NULL,
                \`executionData\` text NOT NULL,
                \`state\` text NOT NULL,
                \`workflowShortId\` varchar(255) NOT NULL,
                \`deployed\` tinyint DEFAULT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`stoppedDate\` datetime(6),
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
        )
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`webhook\` (
                \`id\` varchar(36) NOT NULL,
                \`nodeId\` varchar(255) NOT NULL,
                \`webhookEndpoint\` varchar(255) NOT NULL,
                \`httpMethod\` text NOT NULL,
                \`workflowShortId\` varchar(255) NOT NULL,
                \`webhookId\` varchar(255) NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE execution`)
        await queryRunner.query(`DROP TABLE webhook`)
    }
}
