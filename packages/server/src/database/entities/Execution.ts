/* eslint-disable */
import {
    Entity,
    Column,
    Index,
    BeforeInsert,
    CreateDateColumn,
    PrimaryGeneratedColumn, PrimaryColumn
} from "typeorm";
import {v4 as uuidv4} from 'uuid';

import { shortId } from '../../utils/workflow.utils'
import { ExecutionState, IExecution } from "../../Interface";

@Entity()
export class Execution implements IExecution {
    @Column()
    id: string

    @PrimaryColumn()
    shortId: string

    @BeforeInsert()
    beforeInsert() {
        this.id = uuidv4()
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
