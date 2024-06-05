import client from './client'

const getAllWorkflows = () => client.get('/workflows')

const getSpecificWorkflow = (shortId) => client.get(`/workflows/${shortId}`)

const createNewWorkflow = (body) => client.post(`/workflows`, body) //body: IWorkflow

const updateWorkflow = (shortId, body) => client.put(`/workflows/${shortId}`, body) //body: IWorkflow

const deployWorkflow = (shortId, body) => client.post(`/workflows/deploy/${shortId}`, body || {}) //body: { halt: boolean }

const testWorkflow = (startingNodeId, body) => client.post(`/workflows/test/${startingNodeId}`, body) //body: ITestWorkflowBody

const deleteWorkflow = (shortId) => client.delete(`/workflows/${shortId}`)

const testWorkflowNode = (name, body) => client.post(`/workflows/node-test/${name}`, body) //body: ITestNodeBody

export default {
    getAllWorkflows,
    getSpecificWorkflow,
    createNewWorkflow,
    updateWorkflow,
    deployWorkflow,
    deleteWorkflow,
    testWorkflow,
    testWorkflowNode
}
