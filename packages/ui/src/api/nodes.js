import client from './client'

const getAllNodes = () => client.get('/nodes')
const getChatflowNodes = () => client.get('/chatflow-nodes')
const getWorkflowNodes = () => client.get('/workflow-nodes')

const getSpecificNode = (name) => client.get(`/nodes/${name}`)

const executeCustomFunctionNode = (body) => client.post(`/node-custom-function`, body)

export default {
    getAllNodes,
    getChatflowNodes,
    getWorkflowNodes,
    getSpecificNode,
    executeCustomFunctionNode
}
