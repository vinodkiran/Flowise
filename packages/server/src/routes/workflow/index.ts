import express from 'express'
const router = express.Router()
import workflowController from '../../controllers/workflow'

router.post('/remove-test-triggers', workflowController.removeTestTriggers)
router.post('/remove-test-webhooks', workflowController.removeTestWebhooks)
router.get('/workflows', workflowController.getWorkflows)
router.get('/workflows/:shortId', workflowController.getWorkflowById)
router.post('/workflows', workflowController.createWorkflow)
router.put('/workflows/:shortId', workflowController.updateWorkflow)
router.delete('/api/v1/workflows/:shortId', workflowController.deleteWorkflow)
router.post('/workflows/deploy/:shortId', workflowController.deployWorkflow)
router.get('/get-tunnel-url', workflowController.getTunnelUrl)
router.post('/node-test/:name', workflowController.testNode)
router.post('/workflows/test/:startingNodeId', workflowController.testWorkflowFromStart)
router.get('/executions', workflowController.getAllExecutions)
router.get('/executions/:shortId', workflowController.getExecutionById)
router.post('/executions', workflowController.createNewExecution)
router.put('/api/v1/executions/:shortId', workflowController.updateExecution)
router.delete('/executions/:shortId', workflowController.deleteExecution)
//router.get(`/webhook/*`, workflowController.get)
// router.post(`/api/v1/webhook/*`, )
router.get('/get-tunnel-url', workflowController.getTunnelUrl)
//router.get('/oauth2', workflowController.outh2)
router.get('/oauth2-redirecturl', workflowController.getOAuth2HTMLPath)

export default router
