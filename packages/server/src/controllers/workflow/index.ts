import { NextFunction, Request, Response } from 'express'
import { ITestNodeBody } from '../../Interface'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'

import workflowService from '../../services/workflow'

// ----------------------------------------
// Active Test Pools
// ----------------------------------------
const removeTestTriggers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await workflowService.removeTestTriggers()
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const removeTestWebhooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await workflowService.removeTestWebhooks()
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// ----------------------------------------
// Workflows
// ----------------------------------------

// Get all workflows
const getWorkflows = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await workflowService.getWorkflows()
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

//Get specific workflow via shortId
const getWorkflowById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.shortId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: workflowController.getWorkflowById - id not provided!`)
        }
        const apiResponse = await workflowService.getWorkflowById(req.params.shortId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Create new workflow
const createWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: workflowController.createWorkflow - body not provided!`)
        }
        const apiResponse = await workflowService.createWorkflow(req.body)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Update workflow
const updateWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: workflowController.updateWorkflow - body not provided!`)
        }
        if (typeof req.params === 'undefined' || !req.params.shortId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: workflowController.updateWorkflow - id not provided!`)
        }
        const apiResponse = await workflowService.updateWorkflow(req.params.shortId, req.body)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Delete workflow via shortId
const deleteWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.shortId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: workflowController.deleteWorkflow - id not provided!`)
        }
        const apiResponse = await workflowService.deleteWorkflow(req.params.shortId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Deploy/Halt workflow via shortId
const deployWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.shortId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: workflowController.deployWorkflow - id not provided!`)
        }
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: workflowController.deployWorkflow - body not provided!`)
        }
        const apiResponse = await workflowService.deployWorkflow(req.params.shortId, req.body)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Return configured local tunnel
const getTunnelUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await workflowService.getTunnelURL()
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getOAuth2HTMLPath = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const baseURL = req.get('host')
        if (!baseURL) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: workflowController.getOAuth2HTMLPath - baseURL not provided!`
            )
        }
        const apiResponse = await workflowService.getOAuth2HTMLPath(baseURL, req.secure)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Test a node
const testNode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.name) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: workflowController.testNode - name not provided!`)
        }
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: workflowController.testNode - body not provided!`)
        }
        const apiResponse = await workflowService.testNode(req.params.name, req.body as ITestNodeBody)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Test Workflow from a starting point to end
const testWorkflowFromStart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.startingNodeId) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: workflowController.testWorkflowFromStart - startingNodeId not provided!`
            )
        }
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: workflowController.testWorkflowFromStart - body not provided!`
            )
        }
        if (!req.io) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: workflowController.testWorkflowFromStart - ioServer not found!`
            )
        }
        const apiResponse = await workflowService.testWorkflowFromStart(req.params.startingNodeId, req.body, req.io)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// ----------------------------------------
// Execution
// ----------------------------------------

// Get all executions
const getAllExecutions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await workflowService.getAllExecutions()
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Get specific execution via shortId
const getExecutionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.shortId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: workflowController.getExecutionById - id not provided!`)
        }
        const apiResponse = await workflowService.getExecutionById(req.params.shortId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const createNewExecution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: workflowController.createNewExecution - body not provided!`
            )
        }
        const apiResponse = await workflowService.createNewExecution(req.body)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Update execution
const updateExecution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.shortId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: workflowController.updateExecution - id not provided!`)
        }
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: workflowController.updateExecution - body not provided!`
            )
        }
        const apiResponse = await workflowService.updateExecution(req.params.shortId, req.body)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Delete execution via shortId
const deleteExecution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.shortId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: workflowController.deleteExecution - id not provided!`)
        }
        const apiResponse = await workflowService.deleteExecution(req.params.shortId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// ----------------------------------------
// Webhook
// ----------------------------------------

// GET webhook requests

// this.app.get(`/api/v1/webhook/*`, express.raw(), async (req: Request, res: Response) => {
//     const splitUrl = req.path.split('/api/v1/webhook/')
//     const webhookEndpoint = splitUrl[splitUrl.length - 1]
//     await processWebhook(
//         res,
//         req,
//         this.AppDataSource,
//         webhookEndpoint,
//         'GET',
//         this.nodesPool.componentNodes,
//         this.socketIO,
//         this.deployedWorkflowsPool,
//         this.activeTestWebhookPool
//     )
// })

// POST webhook requests
// this.app.post(`/api/v1/webhook/*`, express.raw(), async (req: Request, res: Response) => {
//     const splitUrl = req.path.split('/api/v1/webhook/')
//     const webhookEndpoint = splitUrl[splitUrl.length - 1]
//     await processWebhook(
//         res,
//         req,
//         this.AppDataSource,
//         webhookEndpoint,
//         'POST',
//         this.nodesPool.componentNodes,
//         this.socketIO,
//         this.deployedWorkflowsPool,
//         this.activeTestWebhookPool
//     )
// })

// ----------------------------------------
// TODO - OAuth2
// ----------------------------------------
// this.app.get('/api/v1/oauth2', async (req: Request, res: Response) => {
//     if (!req.query.credentialId) return res.status(404).send('Credential not found')
//
//     //     const credentialId = req.query.credentialId
//     //     const credential = await this.AppDataSource.getRepository(Credential).findOneBy({
//     //         id: credentialId as string
//     //     })
//     //
//     //     if (!credential) return res.status(404).send(`Credential with Id ${credentialId} not found`)
//     //
//     //     // Decrypt credentialData
//     //     const decryptedCredentialData = await decryptCredentialData(
//     //         credential.encryptedData,
//     //         credential.credentialName,
//     //         this.nodesPool.componentCredentials
//     //     )
//     //
//     //     const baseURL = req.get('host')
//     //     const authUrl = decryptedCredentialData.authUrl as string
//     //     const authorizationURLParameters = decryptedCredentialData.authorizationURLParameters as string
//     //     const clientID = decryptedCredentialData.clientID as string
//     //     const scope = decryptedCredentialData.scope as string
//     //     let scopeArray: any
//     //     try {
//     //         scopeArray = scope.replace(/\s/g, '')
//     //         scopeArray = JSON.parse(scopeArray)
//     //     } catch (e) {
//     //         return res.status(500).send(e)
//     //     }
//     //     const serializedScope = scopeArray.join(' ')
//     //     const redirectUrl = `${req.secure ? 'https' : req.protocol}://${baseURL}/api/v1/oauth2/callback`
//     //
//     //     const returnURL = `${authUrl}?${authorizationURLParameters}&client_id=${clientID}&scope=${serializedScope}&redirect_uri=${redirectUrl}&state=${credentialId}`
//     //
//     //     res.send(returnURL)
//     // })
//     //
//     // this.app.get('/api/v1/oauth2/callback', async (req: Request, res: Response) => {
//     //     const code = req.query.code
//     //     if (!code) return res.status(500).send('Unable to retrieve authorization code from oAuth2 callback')
//     //
//     //     const credentialId = req.query.state
//     //     if (!credentialId) return res.status(500).send('Unable to retrieve credentialId from oAuth2 callback')
//     //
//     //     const credential = await this.AppDataSource.getRepository(Credential).findOneBy({
//     //         id: credentialId as string
//     //     })
//     //
//     //     if (!credential) return res.status(404).send(`Credential with Id ${credentialId} not found`)
//     //
//     //     // Decrypt credentialData
//     //     const decryptedCredentialData = await decryptCredentialData(
//     //         credential.encryptedData,
//     //         credential.credentialName,
//     //         this.nodesPool.componentCredentials
//     //     )
//     //
//     //     // Get access_token and refresh_token
//     //     const accessTokenUrl = decryptedCredentialData.accessTokenUrl as string
//     //     const client_id = decryptedCredentialData.clientID as string
//     //     const client_secret = decryptedCredentialData.clientSecret as string | undefined
//     //     const authUrl = decryptedCredentialData.authUrl as string
//     //     const scope = decryptedCredentialData.scope as string
//     //     let scopeArray: string[] = []
//     //     try {
//     //         scopeArray = JSON.parse(scope.replace(/\s/g, ''))
//     //     } catch (e) {
//     //         return res.status(500).send(e)
//     //     }
//     //
//     //     const baseURL = req.get('host')
//     //     const redirect_uri = `${req.secure ? 'https' : req.protocol}://${baseURL}/api/v1/oauth2/callback`
//     //
//     //     const oAuth2Parameters = {
//     //         clientId: client_id,
//     //         clientSecret: client_secret,
//     //         accessTokenUri: accessTokenUrl,
//     //         authorizationUri: authUrl,
//     //         redirectUri: redirect_uri,
//     //         scopes: scopeArray
//     //     }
//     //
//     //     const oAuthObj = new ClientOAuth2(oAuth2Parameters)
//     //
//     //     const queryParameters = req.originalUrl.split('?').splice(1, 1).join('')
//     //
//     //     const oauthToken = await oAuthObj.code.getToken(`${oAuth2Parameters.redirectUri}?${queryParameters}`)
//     //
//     //     const { access_token, token_type, expires_in, refresh_token } = oauthToken.data
//     //
//     //     const body: ICredentialBody = {
//     //         name: credential.name,
//     //         nodeCredentialName: credential.nodeCredentialName,
//     //         credentialData: {
//     //             ...decryptedCredentialData,
//     //             access_token,
//     //             token_type,
//     //             expires_in,
//     //             refresh_token
//     //         }
//     //     }
//     //
//     //     const updateCredential = await transformToCredentialEntity(body)
//     //
//     //     this.AppDataSource.getRepository(Credential).merge(credential, updateCredential)
//     //     await this.AppDataSource.getRepository(Credential).save(credential)
//
//     return res.sendFile(getOAuth2HTMLPath())
// })

export default {
    removeTestTriggers,
    removeTestWebhooks,
    getWorkflows,
    getWorkflowById,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    deployWorkflow,
    getTunnelUrl,
    getOAuth2HTMLPath,
    testNode,
    testWorkflowFromStart,
    getAllExecutions,
    getExecutionById,
    createNewExecution,
    updateExecution,
    deleteExecution
}
