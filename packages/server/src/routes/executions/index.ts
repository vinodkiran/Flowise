import express from 'express'
const router = express.Router()
import workflowController from '../../controllers/workflow'

router.get('/', workflowController.getAllExecutions)
router.get('/:shortId', workflowController.getExecutionById)
router.post('/', workflowController.createNewExecution)
router.put('/:shortId', workflowController.updateExecution)
router.delete('/:shortId', workflowController.deleteExecution)

export default router
