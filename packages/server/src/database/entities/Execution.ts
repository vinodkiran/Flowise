/* eslint-disable */
import { Entity, Column, Index, BeforeInsert, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm'

import { shortId } from '../../utils/workflow.utils'
import { ExecutionState, IExecution } from '../../Interface'

@Entity()
export class Execution implements IExecution {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    @Index()
    shortId: string

    @BeforeInsert()
    beforeInsert() {
        this.shortId = shortId('E', new Date())
    }

    @Column()
    executionData: string

    @Column()
    state: ExecutionState

    @Column()
    workflowShortId: string

    @Column()
    deployed: boolean

    @CreateDateColumn()
    createdDate: Date

    @Column({ nullable: true })
    stoppedDate: Date
}
