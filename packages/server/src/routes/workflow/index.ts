import express from 'express'
const router = express.Router()
import workflowController from '../../controllers/workflow'

router.post('/remove-test-triggers', workflowController.removeTestTriggers)
router.post('/remove-test-webhooks', workflowController.removeTestWebhooks)
router.get('/', workflowController.getWorkflows)
router.get('/:shortId', workflowController.getWorkflowById)
router.post('/', workflowController.createWorkflow)
router.put('/:shortId', workflowController.updateWorkflow)
router.delete('/:shortId', workflowController.deleteWorkflow)
router.post('/deploy/:shortId', workflowController.deployWorkflow)
router.get('/get-tunnel-url', workflowController.getTunnelUrl)
router.post('/node-test/:name', workflowController.testNode)
router.post('/test/:startingNodeId', workflowController.testWorkflowFromStart)

//router.get(`/webhook/*`, workflowController.get)
// router.post(`/api/v1/webhook/*`, )
//router.get('/get-tunnel-url', workflowController.getTunnelUrl)
//router.get('/oauth2', workflowController.outh2)
router.get('/oauth2-redirecturl', workflowController.getOAuth2HTMLPath)

export default router
