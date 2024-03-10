import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { OpenAI } from '@langchain/openai'
import { loadEvaluator } from 'langchain/evaluation'

export class EvaluationRunner {
    static metrics = new Map<string, string[]>()
    static getAndDeleteMetrics(id: string) {
        const val = EvaluationRunner.metrics.get(id)
        EvaluationRunner.metrics.delete(id)
        return val
    }

    static addMetrics(id: string, metric: string) {
        if (EvaluationRunner.metrics.has(id)) {
            EvaluationRunner.metrics.get(id)?.push(metric)
        } else {
            EvaluationRunner.metrics.set(id, [metric])
        }
    }

    baseURL = ''
    evaluator: any
    constructor(port: number) {
        this.baseURL = `http://localhost:${port}`
    }

    public async runSimpleEvaluation(data: any) {
        // simulate a long-running process, e.g. a call to a database or an API
        // return new Promise with a timeout of 30 seconds
        // return new Promise((resolve) => {
        //     setTimeout(() => {
        //         resolve(data)
        //     }, 30000)

        const runs: any[] = []
        try {
            const promises: any[] = []
            data.dataset.rows.map(async (item: any) => {
                const uuid = uuidv4()
                let axiosConfig = {
                    headers: {
                        'X-Request-ID': uuid,
                        'X-Flowise-Evaluation': 'true'
                    }
                }
                let startTime = performance.now()
                const postData = { question: item.input, evaluationRunId: uuid, evaluation: true }
                let response1 = axios
                    .post(`${this.baseURL}/api/v1/prediction/${data.chatflowId}`, postData, axiosConfig)
                    .then(async function (response) {
                        const runData: any = {}
                        const endTime = performance.now()
                        const timeTaken = (endTime - startTime).toFixed(2)
                        runData.metrics = JSON.stringify({
                            apiLatency: timeTaken + ' ms'
                        })
                        runData.evaluationId = data.evaluationId
                        runData.input = item.input
                        runData.uuid = uuid
                        runData.expectedOutput = item.output
                        runData.actualOutput = response.data.text
                        runData.runDate = new Date()
                        runData.latency = timeTaken
                        runs.push(runData)
                        return runData
                    })
                    .catch(function (error) {
                        console.error(error)
                    })
                promises.push(response1)
            })
            return Promise.all(promises)
        } catch (e) {
            console.error(e)
        }
        return Promise.resolve(runs)
    }

    public async runLLMEvaluation(data: any) {
        console.log(' runLLmEvaluation :: ' + data)
        return Promise.resolve([])
    }

    private async initEvaluator(data: any) {
        const llm = new OpenAI({ temperature: 0, openAIApiKey: data.decryptedCredentialData.openAIApiKey })
        this.evaluator = await loadEvaluator('labeled_criteria', {
            criteria: 'correctness',
            llm: llm
        })
    }

    public async evaluateAnswer(data: any) {
        if (this.evaluator === undefined) {
            await this.initEvaluator(data)
        }
        const res = await this.evaluator.evaluateStrings({
            input: data.input,
            prediction: data.actualOutput,
            reference: data.expectedOutput
        })
        return {
            reasoning: res?.reasoning,
            score: res?.score
        }
    }

    public async runEvaluation(evaluationType: string, data: any) {
        if (evaluationType === 'simple' || evaluationType === 'llm') {
            return this.runSimpleEvaluation(data)
            // } else if (evaluationType === 'llm') {
            //     this.runSimpleEvaluation(data).then((result) => {
            //         result.map(async (runData: any) => {
            //             console.log('runLLMEvaluation :: ' + result)
            //             runData.input = item.input
            //             runData.uuid = uuid
            //             runData.expectedOutput = item.output
            //             runData.actualOutput = response.data.text
            //         })
            //     })
        }
        console.log(' runLLmEvaluation :: ' + data)
        return Promise.resolve([])
    }
}
