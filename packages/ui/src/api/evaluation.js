import client from './client'

const getAllEvaluations = () => client.get('/evaluations')
const getEvaluation = (id) => client.get(`/evaluations/${id}`)

//evaluation
const createEvaluation = (body) => client.post(`/evaluation`, body)
const deleteEvaluation = (id) => client.delete(`/evaluations/${id}`)
// const updateDataset = (id, body) => client.put(`/datasets/${id}`, body)
//
// //rows
// const createDatasetRow = (body) => client.post(`/datasetrow`, body)
// const updateDatasetRow = (id, body) => client.put(`/datasetrow/${id}`, body)
// const deleteDatasetRow = (id) => client.delete(`/datasetrow/${id}`)

export default {
    createEvaluation,
    deleteEvaluation,
    getAllEvaluations,
    getEvaluation
}
