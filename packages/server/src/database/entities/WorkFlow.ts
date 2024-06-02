/* eslint-disable */
import {
    Entity,
    Column,
    BeforeInsert,
    CreateDateColumn,
    UpdateDateColumn, PrimaryGeneratedColumn, Index
} from "typeorm";
import { shortId } from '../../utils/workflow.utils'
import { IWorkFlow } from '../../Interface'

@Entity()
export class WorkFlow implements IWorkFlow {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    @Index()
    shortId: string

    @BeforeInsert()
    beforeInsert() {
        this.shortId = shortId('W', new Date())
    }

    @Column()
    name: string

    @Column()
    flowData: string

    @Column()
    deployed: boolean

    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date
}