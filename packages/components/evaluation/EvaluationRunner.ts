import axios from 'axios'

export class EvaluationRunner {
    baseURL = 'http://localhost:8000'
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
                let startTime = performance.now()
                let response1 = axios
                    .post(`${this.baseURL}/api/v1/prediction/${data.chatflowId}`, { question: item.input })
                    .then(async function (response) {
                        const runData: any = {}
                        const endTime = performance.now()
                        const timeTaken = (endTime - startTime).toFixed(2)
                        runData.metrics = JSON.stringify({
                            latency: timeTaken + ' ms',
                            promptTokens: 0,
                            responseTokens: 0,
                            totalTokens: 0,
                            bert_precision: 0,
                            bert_f1: 0,
                            bert_recall: 0
                        })
                        runData.evaluationId = data.evaluationId
                        runData.input = item.input
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
}
