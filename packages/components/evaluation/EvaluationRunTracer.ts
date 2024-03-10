import { RunCollectorCallbackHandler } from '@langchain/core/tracers/run_collector'
import { Run } from '@langchain/core/tracers/base'
import { EvaluationRunner } from './EvaluationRunner'

export class EvaluationRunTracer extends RunCollectorCallbackHandler {
    evaluationRunId: string
    constructor(id: string) {
        super()
        this.evaluationRunId = id
    }

    async persistRun(run: Run): Promise<void> {
        return super.persistRun(run)
    }

    async onRunUpdate(run: Run): Promise<void> {
        const json = {
            [run.run_type]: elapsed(run)
        }
        EvaluationRunner.addMetrics(this.evaluationRunId, JSON.stringify(json))
        if (run.run_type === 'llm') {
            EvaluationRunner.addMetrics(this.evaluationRunId, run.outputs?.llmOutput?.estimatedTokenUsage)
        }
    }
}

function elapsed(run: Run) {
    if (!run.end_time) return ''
    const elapsed = run.end_time - run.start_time
    if (elapsed < 1000) {
        return `${elapsed}ms`
    }
    return `${(elapsed / 1000).toFixed(2)}s`
}
