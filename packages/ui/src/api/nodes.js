import client from './client'

const getAllNodes = () => client.get('/nodes')
// const getChatflowNodes = () => client.get('/nodes/workflow')
const getWorkflowNodes = () => client.get('/nodes/workflow')
const getSpecificNode = (name) => client.get(`/nodes/${name}`)
const getNodesByCategory = (name) => client.get(`/nodes/category/${name}`)

const executeCustomFunctionNode = (body) => client.post(`/node-custom-function`, body)

export default {
    getAllNodes,
    getWorkflowNodes,
    getSpecificNode,
    executeCustomFunctionNode,
    getNodesByCategory
}
