import client from './client'

const getAllDatasets = () => client.get('/datasets')
const getDatasetRows = (id) => client.get(`/dataset/${id}`)

//dataset
const createDataset = (body) => client.post(`/datasets`, body)
const updateDataset = (id, body) => client.put(`/datasets/${id}`, body)
const deleteDataset = (id) => client.delete(`/datasets/${id}`)

//rows
const createDatasetRow = (body) => client.post(`/datasetrow`, body)
const updateDatasetRow = (id, body) => client.put(`/datasetrow/${id}`, body)
const deleteDatasetRow = (id) => client.delete(`/datasetrow/${id}`)

export default {
    getAllDatasets,
    createDataset,
    updateDataset,
    deleteDataset,
    getDatasetRows,
    createDatasetRow,
    updateDatasetRow,
    deleteDatasetRow
}
