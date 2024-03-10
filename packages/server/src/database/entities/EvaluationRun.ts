import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { IEvaluationRun } from '../../Interface'

@Entity()
export class EvaluationRun implements IEvaluationRun {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column()
    evaluationId: string
    @Column({ type: 'text' })
    metrics: string
    @Column({ type: 'text' })
    input: string
    @Column({ type: 'text' })
    expectedOutput: string
    @Column({ type: 'text' })
    actualOutput: string
    @Column({ type: 'text' })
    reasoning: string
    @Column()
    score: number
    @UpdateDateColumn()
    runDate: Date
}
