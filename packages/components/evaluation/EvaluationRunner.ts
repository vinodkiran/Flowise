import axios from 'axios'

export class EvaluationRunner {
    baseURL = 'http://localhost:8000'
    constructor(port: number) {
        this.baseURL = `http://localhost:${port}`
    }

    public async runSimpleEvaluation(data: any) {
        // const dataFields = [...inputFields]
        // try {
        //     const promises = []
        //     dataFields.map(async (data, index) => {
        //         let startTime = performance.now()
        //         let response1 = axios
        //             .post(`${this.baseURL}/api/v1/prediction/${data.chatflow}`, { question: data.input })
        //             .then(async function (response) {
        //                 const endTime = performance.now()
        //                 data.time = (endTime - startTime).toFixed(2) + ' ms'
        //                 inputFields[index].prediction = response.data.text
        //                 inputFields[index].time = data.time
        //                 return response.data
        //             })
        //             .catch(function (error) {
        //                 console.error(error)
        //             })
        //         promises.push(response1)
        //     })
        //     await Promise.all(promises)
        // } catch (e) {
        //     console.error(e)
        // }
        // return dataFields
    }
}
