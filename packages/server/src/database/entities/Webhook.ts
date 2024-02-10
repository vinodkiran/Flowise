/* eslint-disable */
import { Column, Entity, Index, CreateDateColumn, UpdateDateColumn, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'
import { IWebhook, WebhookMethod } from '../../Interface'

@Entity()
export class Webhook implements IWebhook {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    nodeId: string

    @Index()
    @Column()
    webhookEndpoint: string

    @Index()
    @Column()
    httpMethod: WebhookMethod

    @Column()
    workflowShortId: string

    @Column({ nullable: true })
    webhookId: string

    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date
}
