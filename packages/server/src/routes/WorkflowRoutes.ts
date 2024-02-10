import express, { Request, Response } from 'express'

import { AbstractRoutes } from './AbstractRoutes'
import { WorkFlow } from '../database/entities/WorkFlow'
import {
    IComponentNodesPool,
    IExecution,
    IExecutionResponse,
    IExploredNode,
    INode,
    INodeDirectedGraph,
    INodeQueue,
    IReactFlowEdge,
    IReactFlowNode,
    IReactFlowObject,
    ITestNodeBody,
    ITestWorkflowBody,
    ITriggerNode,
    IWebhookNode,
    IWorkFlow,
    IWorkflowExecutedData,
    IWorkflowResponse,
    WebhookMethod
} from '../Interface'
import { INodeData as INodeDataFromComponent, INodeData, INodeExecutionData } from 'flowise-components'
import {
    checkOAuth2TokenRefreshed,
    constructGraphs,
    constructGraphsAndGetStartingNodes,
    getOAuth2HTMLPath,
    processWebhook,
    resolveVariables
} from '../utils/workflow.utils'
import { DataSource } from 'typeorm'
import { decryptCredentialData, getEncryptionKey } from '../utils'
import { Credential } from '../database/entities/Credential'
import { Server } from 'socket.io'
import { ActiveTestTriggerPool } from '../workflow/ActiveTestTriggerPool'
import { ActiveTestWebhookPool } from '../workflow/ActiveTestWebhookPool'
import { DeployedWorkflowPool } from '../workflow/DeployedWorkflowPool'
import { Webhook } from '../database/entities/Webhook'
import { Execution } from '../database/entities/Execution'

export class WorkflowRoutes extends AbstractRoutes {
    get socketIO(): Server {
        return this._socketIO
    }

    set socketIO(value: Server) {
        this._socketIO = value
    }
    private _socketIO: Server

    private readonly activeTestTriggerPool: ActiveTestTriggerPool
    private readonly activeTestWebhookPool: ActiveTestWebhookPool
    private readonly deployedWorkflowsPool: DeployedWorkflowPool

    constructor(
        app: express.Application,
        activeTestTriggerPool: ActiveTestTriggerPool,
        activeTestWebhookPool: ActiveTestWebhookPool,
        deployedWorkflowsPool: DeployedWorkflowPool
    ) {
        super(app)
        this.activeTestTriggerPool = activeTestTriggerPool
        this.activeTestWebhookPool = activeTestWebhookPool
        this.deployedWorkflowsPool = deployedWorkflowsPool
    }

    configureRoutes() {
        // ----------------------------------------
        // Active Test Pools
        // ----------------------------------------

        // Remove active test triggers
        this.app.post('/api/v1/remove-test-triggers', async (_: Request, res: Response) => {
            if (this.activeTestTriggerPool) await this.activeTestTriggerPool.removeAll(this.nodesPool.componentNodes)
            res.status(200).send('success')
            return
        })

        // Remove active test webhooks
        this.app.post('/api/v1/remove-test-webhooks', async (_: Request, res: Response) => {
            if (this.activeTestWebhookPool) await this.activeTestWebhookPool.removeAll(this.nodesPool.componentNodes)
            res.status(200).send('success')
            return
        })

        // ----------------------------------------
        // Workflows
        // ----------------------------------------

        // Get all workflows
        this.app.get('/api/v1/workflows', async (_: Request, res: Response) => {
            const workflows = await this.AppDataSource.getRepository(WorkFlow).find()
            return res.json(workflows)
        })

        //Get specific workflow via shortId
        this.app.get('/api/v1/workflows/:shortId', async (req: Request, res: Response) => {
            const workflow = await this.AppDataSource.getRepository(WorkFlow).findOneBy({ shortId: req.params.shortId })
            if (workflow) return res.json(workflow)
            return res.status(404).send(`Workflow ${req.params.shortId} not found`)
        })

        // Create new workflow
        this.app.post('/api/v1/workflows', async (req: Request, res: Response) => {
            const body = req.body
            const newWorkflow = new WorkFlow()
            Object.assign(newWorkflow, body)

            const workflow = this.AppDataSource.getRepository(WorkFlow).create(newWorkflow)
            const results = await this.AppDataSource.getRepository(WorkFlow).save(workflow)
            return res.json(results)
        })

        // Update workflow
        this.app.put('/api/v1/workflows/:shortId', async (req: Request, res: Response) => {
            const workflow = await this.AppDataSource.getRepository(WorkFlow).findOneBy({
                shortId: req.params.shortId
            })

            if (!workflow) {
                res.status(404).send(`Workflow ${req.params.shortId} not found`)
                return
            }

            // If workflow is deployed, remove from deployedWorkflowsPool, then add it again for new changes to be picked up
            if (workflow.deployed && workflow.flowData) {
                try {
                    const flowDataString = workflow.flowData
                    const flowData: IReactFlowObject = JSON.parse(flowDataString)
                    const reactFlowNodes = flowData.nodes as IReactFlowNode[]
                    const reactFlowEdges = flowData.edges as IReactFlowEdge[]
                    const workflowShortId = workflow.shortId

                    const response = constructGraphsAndGetStartingNodes(res, reactFlowNodes, reactFlowEdges)
                    if (response === undefined) return

                    const { startingNodeIds } = response

                    await this.deployedWorkflowsPool.remove(startingNodeIds, reactFlowNodes, this.nodesPool.componentNodes, workflowShortId)
                } catch (e) {
                    return res.status(500).send(e)
                }
            }

            const body = req.body
            const updateWorkflow = new WorkFlow()
            Object.assign(updateWorkflow, body)

            this.AppDataSource.getRepository(WorkFlow).merge(workflow, updateWorkflow)
            const result = await this.AppDataSource.getRepository(WorkFlow).save(workflow)

            if (result) {
                let executionCount = await this.AppDataSource.getRepository(Execution).count({
                    where: { workflowShortId: result.shortId }
                })
                const returnWorkflow: IWorkflowResponse = {
                    ...result,
                    executionCount
                }
                if (returnWorkflow.deployed && returnWorkflow.flowData) {
                    try {
                        const flowData: IReactFlowObject = JSON.parse(returnWorkflow.flowData)
                        const reactFlowNodes = flowData.nodes as IReactFlowNode[]
                        const reactFlowEdges = flowData.edges as IReactFlowEdge[]
                        const workflowShortId = returnWorkflow.shortId

                        const response = constructGraphsAndGetStartingNodes(res, reactFlowNodes, reactFlowEdges)
                        if (response === undefined) return

                        const { graph, startingNodeIds } = response
                        await this.deployedWorkflowsPool.add(
                            startingNodeIds,
                            graph,
                            reactFlowNodes,
                            this.nodesPool.componentNodes,
                            workflowShortId,
                            this.activeTestTriggerPool,
                            this.activeTestWebhookPool
                        )
                    } catch (e) {
                        return res.status(500).send(e)
                    }
                }
                return res.json(returnWorkflow)
            }
            return res.status(404).send(`Workflow ${req.params.shortId} not found`)
        })

        // Delete workflow via shortId
        this.app.delete('/api/v1/workflows/:shortId', async (req: Request, res: Response) => {
            const workflow = await this.AppDataSource.getRepository(WorkFlow).findOneBy({
                shortId: req.params.shortId
            })

            if (!workflow) {
                res.status(404).send(`Workflow ${req.params.shortId} not found`)
                return
            }

            // If workflow is deployed, remove from deployedWorkflowsPool
            if (workflow.deployed && workflow.flowData) {
                try {
                    const flowDataString = workflow.flowData
                    const flowData: IReactFlowObject = JSON.parse(flowDataString)
                    const reactFlowNodes = flowData.nodes as IReactFlowNode[]
                    const reactFlowEdges = flowData.edges as IReactFlowEdge[]
                    const workflowShortId = workflow.shortId

                    const response = constructGraphsAndGetStartingNodes(res, reactFlowNodes, reactFlowEdges)
                    if (response === undefined) return

                    const { startingNodeIds } = response

                    await this.deployedWorkflowsPool.remove(startingNodeIds, reactFlowNodes, this.nodesPool.componentNodes, workflowShortId)
                } catch (e) {
                    return res.status(500).send(e)
                }
            }
            const results = await this.AppDataSource.getRepository(WorkFlow).delete({ shortId: req.params.shortId })
            await this.AppDataSource.getRepository(Webhook).delete({ workflowShortId: req.params.shortId })
            await this.AppDataSource.getRepository(Execution).delete({ workflowShortId: req.params.shortId })
            return res.json(results)
        })

        // Deploy/Halt workflow via shortId
        this.app.post('/api/v1/workflows/deploy/:shortId', async (req: Request, res: Response) => {
            const workflow = await this.AppDataSource.getRepository(WorkFlow).findOneBy({
                shortId: req.params.shortId
            })

            if (!workflow) {
                res.status(404).send(`Workflow ${req.params.shortId} not found`)
                return
            }

            try {
                const flowDataString = workflow.flowData
                const flowData: IReactFlowObject = JSON.parse(flowDataString)
                const reactFlowNodes = flowData.nodes as IReactFlowNode[]
                const reactFlowEdges = flowData.edges as IReactFlowEdge[]
                const workflowShortId = req.params.shortId
                const haltDeploy = req.body?.halt

                const response = constructGraphsAndGetStartingNodes(res, reactFlowNodes, reactFlowEdges)
                if (response === undefined) return
                const { graph, startingNodeIds } = response

                if (!haltDeploy) {
                    await this.deployedWorkflowsPool.add(
                        startingNodeIds,
                        graph,
                        reactFlowNodes,
                        this.nodesPool.componentNodes,
                        workflowShortId,
                        this.activeTestTriggerPool,
                        this.activeTestWebhookPool
                    )
                } else {
                    await this.deployedWorkflowsPool.remove(startingNodeIds, reactFlowNodes, this.nodesPool.componentNodes, workflowShortId)
                }

                const body = { deployed: !haltDeploy }
                const updateWorkflow = new WorkFlow()
                Object.assign(updateWorkflow, body)

                this.AppDataSource.getRepository(WorkFlow).merge(workflow, updateWorkflow)
                const result = await this.AppDataSource.getRepository(WorkFlow).save(workflow)
                if (result) {
                    let executionCount = await this.AppDataSource.getRepository(Execution).count({
                        where: { workflowShortId: result.shortId }
                    })
                    const returnWorkflow: IWorkflowResponse = {
                        ...workflow,
                        executionCount
                    }
                    return res.json(returnWorkflow)
                }
                return res.status(404).send(`Workflow ${req.params.shortId} not found`)
            } catch (e) {
                res.status(500).send(`Workflow ${req.params.shortId} deploy error: ${e}`)
                return
            }
        })
        // Return configured local tunnel
        this.app.get('/api/v1/get-tunnel-url', (_: Request, res: Response) => {
            if (!process.env.TUNNEL_BASE_URL) throw new Error(`Tunnel URL not found`)
            res.send(process.env.TUNNEL_BASE_URL)
        })

        // Test a node
        this.app.post('/api/v1/node-test/:name', async (req: Request, res: Response) => {
            const body: ITestNodeBody = req.body
            const { nodes, edges, nodeId, clientId } = body

            const node = nodes.find((nd: IReactFlowNode) => nd.id === nodeId)

            if (!node) return res.status(404).send(`Test node ${nodeId} not found`)

            if (Object.prototype.hasOwnProperty.call(this.nodesPool.componentNodes, req.params.name)) {
                try {
                    const nodeInstance = this.nodesPool.componentNodes[req.params.name]
                    const nodeType = nodeInstance.type
                    const nodeData = node.data

                    await decryptNodeCredentials(nodeData, this.AppDataSource)

                    if (nodeType === 'action') {
                        let results: INodeExecutionData[] = []
                        const reactFlowNodeData: INodeData[] = resolveVariables(nodeData, nodes)
                        for (let i = 0; i < reactFlowNodeData.length; i += 1) {
                            const result = await nodeInstance.runWorkflow!.call(nodeInstance, reactFlowNodeData[i])
                            checkOAuth2TokenRefreshed(result, reactFlowNodeData[i])
                            if (result) results.push(...result)
                        }
                        return res.json(results)
                    } else if (nodeType === 'trigger') {
                        const triggerNodeInstance = nodeInstance as ITriggerNode
                        const emitEventKey = nodeId
                        nodeData.emitEventKey = emitEventKey
                        triggerNodeInstance.once(emitEventKey, async (result: INodeExecutionData[]) => {
                            await this.activeTestTriggerPool.remove(nodeData.name, this.nodesPool.componentNodes)
                            return res.json(result)
                        })
                        await triggerNodeInstance.runTrigger!.call(triggerNodeInstance, nodeData)
                        this.activeTestTriggerPool.add(req.params.name, nodeData)
                    } else if (nodeType === 'webhook') {
                        const webhookNodeInstance = nodeInstance as IWebhookNode
                        const newBody = {
                            webhookEndpoint: nodeData.webhookEndpoint,
                            httpMethod: (nodeData.inputParameters?.httpMethod as WebhookMethod) || 'POST'
                        } as any

                        if (webhookNodeInstance.webhookMethods?.createWebhook) {
                            if (!process.env.TUNNEL_BASE_URL) {
                                res.status(500).send(`Please enable tunnel by setting ENABLE_TUNNEL to true in env file`)
                                return
                            }

                            const webhookFullUrl = `${process.env.TUNNEL_BASE_URL}api/v1/webhook/${nodeData.webhookEndpoint}`
                            const webhookId = await webhookNodeInstance.webhookMethods?.createWebhook.call(
                                webhookNodeInstance,
                                nodeData,
                                webhookFullUrl
                            )

                            if (webhookId !== undefined) {
                                newBody.webhookId = webhookId
                            }
                        }

                        this.activeTestWebhookPool.add(
                            newBody.webhookEndpoint,
                            newBody.httpMethod,
                            nodes,
                            edges,
                            nodeData,
                            nodeId,
                            clientId as string,
                            false,
                            newBody?.webhookId
                        )

                        return res.json(newBody)
                    }
                } catch (error) {
                    res.status(500).send(`Node test error: ${error}`)
                    console.error(error)
                    return
                }
            } else {
                res.status(404).send(`Node ${req.params.name} not found`)
                return
            }
        })

        // Test Workflow from a starting point to end
        this.app.post('/api/v1/workflows/test/:startingNodeId', async (req: Request, res: Response) => {
            const body = req.body as ITestWorkflowBody
            const nodes = body.nodes || []
            const edges = body.edges || []
            const clientId = body.clientId || ''

            const { graph } = constructGraphs(nodes, edges)
            const startingNodeId = req.params.startingNodeId

            const startNode = nodes.find((nd: IReactFlowNode) => nd.id === startingNodeId)

            if (startNode && startNode.data) {
                let nodeData = startNode.data as INodeDataFromComponent
                await decryptNodeCredentials(nodeData, this.AppDataSource)
                const nodeDataArray = resolveVariables(nodeData, nodes)
                nodeData = nodeDataArray[0]

                let componentNodes = this.nodesPool.componentNodes
                if (!Object.prototype.hasOwnProperty.call(componentNodes, nodeData.name)) {
                    res.status(404).send(`Unable to test workflow from node: ${nodeData.name}`)
                    return
                }

                if (nodeData.type === 'trigger') {
                    const triggerNodeInstance = componentNodes[nodeData.name] as ITriggerNode
                    const emitEventKey = startingNodeId
                    nodeData.emitEventKey = emitEventKey

                    triggerNodeInstance.once(emitEventKey, async (result: INodeExecutionData[]) => {
                        await this.activeTestTriggerPool.remove(nodeData.name, componentNodes)

                        const newWorkflowExecutedData = {
                            nodeId: startingNodeId,
                            nodeLabel: nodeData.label,
                            data: result,
                            status: 'FINISHED'
                        } as IWorkflowExecutedData

                        this._socketIO.to(clientId).emit('testWorkflowNodeResponse', newWorkflowExecutedData)

                        await testWorkflow(
                            startingNodeId,
                            result,
                            nodes,
                            edges,
                            graph,
                            componentNodes,
                            clientId,
                            this.socketIO,
                            this.AppDataSource,
                            undefined
                        )
                    })

                    await triggerNodeInstance.runTrigger!.call(triggerNodeInstance, nodeData)
                    this.activeTestTriggerPool.add(nodeData.name, nodeData)
                } else if (nodeData.type === 'webhook') {
                    const webhookNodeInstance = componentNodes[nodeData.name] as IWebhookNode
                    const newBody = {
                        webhookEndpoint: nodeData.webhookEndpoint,
                        httpMethod: (nodeData.inputParameters?.httpMethod as WebhookMethod) || 'POST'
                    } as any

                    if (webhookNodeInstance.webhookMethods?.createWebhook) {
                        if (!process.env.TUNNEL_BASE_URL) {
                            res.status(500).send(`Please enable tunnel by setting ENABLE_TUNNEL to true in env file`)
                            return
                        }

                        const webhookFullUrl = `${process.env.TUNNEL_BASE_URL}api/v1/webhook/${nodeData.webhookEndpoint}`
                        const webhookId = await webhookNodeInstance.webhookMethods?.createWebhook.call(
                            webhookNodeInstance,
                            nodeData,
                            webhookFullUrl
                        )

                        if (webhookId !== undefined) {
                            newBody.webhookId = webhookId
                        }
                    }

                    this.activeTestWebhookPool.add(
                        newBody.webhookEndpoint,
                        newBody.httpMethod,
                        nodes,
                        edges,
                        nodeData,
                        startingNodeId,
                        clientId,
                        true,
                        newBody?.webhookId
                    )
                } else if (nodeData.type === 'action') {
                    const actionNodeInstance = componentNodes[nodeData.name] as INode
                    const result = await actionNodeInstance.runWorkflow!.call(actionNodeInstance, nodeData)
                    checkOAuth2TokenRefreshed(result, nodeData)

                    const newWorkflowExecutedData = {
                        nodeId: startingNodeId,
                        nodeLabel: nodeData.label,
                        data: result,
                        status: 'FINISHED'
                    } as IWorkflowExecutedData

                    this._socketIO.to(clientId).emit('testWorkflowNodeResponse', newWorkflowExecutedData)

                    const reactFlowNodes = nodes
                    const nodeIndex = reactFlowNodes.findIndex((nd) => nd.id === startingNodeId)
                    updateNodeOutput(reactFlowNodes, nodeIndex, result || [])

                    await testWorkflow(
                        startingNodeId,
                        result || [],
                        reactFlowNodes,
                        edges,
                        graph,
                        componentNodes,
                        clientId,
                        this._socketIO,
                        this.AppDataSource
                    )
                }
            }
        })

        // ----------------------------------------
        // Execution
        // ----------------------------------------

        // Get all executions
        this.app.get('/api/v1/executions', async (_: Request, res: Response) => {
            /* TODO: Query using relations */
            const executions: IExecution[] = await this.AppDataSource.getRepository(Execution).find()
            let response: IExecutionResponse[] = []
            executions.map(async (execution) => {
                let workflow = await this.AppDataSource.getRepository(WorkFlow).findOneBy({ shortId: execution.workflowShortId })
                response.push({
                    ...execution,
                    workflow: workflow as IWorkFlow
                })
            })
            return res.json(response)
        })

        // Get specific execution via shortId
        this.app.get('/api/v1/executions/:shortId', async (req: Request, res: Response) => {
            const results = await this.AppDataSource.getRepository(Execution).findOneBy({
                shortId: req.params.shortId
            })
            return res.json(results)
        })

        // Create new execution
        this.app.post('/api/v1/executions', async (req: Request, res: Response) => {
            const body = req.body
            const newExecution = new Execution()
            Object.assign(newExecution, body)

            const execution = this.AppDataSource.getRepository(Execution).create(newExecution)
            const results = await this.AppDataSource.getRepository(Execution).save(execution)
            return res.json(results)
        })

        // Update execution
        this.app.put('/api/v1/executions/:shortId', async (req: Request, res: Response) => {
            const execution = await this.AppDataSource.getRepository(Execution).findOneBy({
                shortId: req.params.shortId
            })

            if (!execution) {
                res.status(404).send(`Execution ${req.params.shortId} not found`)
                return
            }

            const body = req.body
            const updateExecution = new Execution()
            Object.assign(updateExecution, body)

            this.AppDataSource.getRepository(Execution).merge(execution, updateExecution)
            const results = await this.AppDataSource.getRepository(Execution).save(execution)
            return res.json(results)
        })

        // Delete execution via shortId
        this.app.delete('/api/v1/executions/:shortId', async (req: Request, res: Response) => {
            const results = await this.AppDataSource.getRepository(Execution).delete({ shortId: req.params.shortId })
            return res.json(results)
        })

        // ----------------------------------------
        // Webhook
        // ----------------------------------------

        // GET webhook requests
        this.app.get(`/api/v1/webhook/*`, express.raw(), async (req: Request, res: Response) => {
            const splitUrl = req.path.split('/api/v1/webhook/')
            const webhookEndpoint = splitUrl[splitUrl.length - 1]
            await processWebhook(
                res,
                req,
                this.AppDataSource,
                webhookEndpoint,
                'GET',
                this.nodesPool.componentNodes,
                this.socketIO,
                this.deployedWorkflowsPool,
                this.activeTestWebhookPool
            )
        })

        // POST webhook requests
        this.app.post(`/api/v1/webhook/*`, express.raw(), async (req: Request, res: Response) => {
            const splitUrl = req.path.split('/api/v1/webhook/')
            const webhookEndpoint = splitUrl[splitUrl.length - 1]
            await processWebhook(
                res,
                req,
                this.AppDataSource,
                webhookEndpoint,
                'POST',
                this.nodesPool.componentNodes,
                this.socketIO,
                this.deployedWorkflowsPool,
                this.activeTestWebhookPool
            )
        })

        this.app.get('/api/v1/get-tunnel-url', (_: Request, res: Response) => {
            if (!process.env.TUNNEL_BASE_URL) throw new Error(`Tunnel URL not found`)
            res.send(process.env.TUNNEL_BASE_URL)
        })

        // ----------------------------------------
        // TODO - OAuth2
        // ----------------------------------------
        this.app.get('/api/v1/oauth2', async (req: Request, res: Response) => {
            if (!req.query.credentialId) return res.status(404).send('Credential not found')

            //     const credentialId = req.query.credentialId
            //     const credential = await this.AppDataSource.getRepository(Credential).findOneBy({
            //         id: credentialId as string
            //     })
            //
            //     if (!credential) return res.status(404).send(`Credential with Id ${credentialId} not found`)
            //
            //     // Decrypt credentialData
            //     const decryptedCredentialData = await decryptCredentialData(
            //         credential.encryptedData,
            //         credential.credentialName,
            //         this.nodesPool.componentCredentials
            //     )
            //
            //     const baseURL = req.get('host')
            //     const authUrl = decryptedCredentialData.authUrl as string
            //     const authorizationURLParameters = decryptedCredentialData.authorizationURLParameters as string
            //     const clientID = decryptedCredentialData.clientID as string
            //     const scope = decryptedCredentialData.scope as string
            //     let scopeArray: any
            //     try {
            //         scopeArray = scope.replace(/\s/g, '')
            //         scopeArray = JSON.parse(scopeArray)
            //     } catch (e) {
            //         return res.status(500).send(e)
            //     }
            //     const serializedScope = scopeArray.join(' ')
            //     const redirectUrl = `${req.secure ? 'https' : req.protocol}://${baseURL}/api/v1/oauth2/callback`
            //
            //     const returnURL = `${authUrl}?${authorizationURLParameters}&client_id=${clientID}&scope=${serializedScope}&redirect_uri=${redirectUrl}&state=${credentialId}`
            //
            //     res.send(returnURL)
            // })
            //
            // this.app.get('/api/v1/oauth2/callback', async (req: Request, res: Response) => {
            //     const code = req.query.code
            //     if (!code) return res.status(500).send('Unable to retrieve authorization code from oAuth2 callback')
            //
            //     const credentialId = req.query.state
            //     if (!credentialId) return res.status(500).send('Unable to retrieve credentialId from oAuth2 callback')
            //
            //     const credential = await this.AppDataSource.getRepository(Credential).findOneBy({
            //         id: credentialId as string
            //     })
            //
            //     if (!credential) return res.status(404).send(`Credential with Id ${credentialId} not found`)
            //
            //     // Decrypt credentialData
            //     const decryptedCredentialData = await decryptCredentialData(
            //         credential.encryptedData,
            //         credential.credentialName,
            //         this.nodesPool.componentCredentials
            //     )
            //
            //     // Get access_token and refresh_token
            //     const accessTokenUrl = decryptedCredentialData.accessTokenUrl as string
            //     const client_id = decryptedCredentialData.clientID as string
            //     const client_secret = decryptedCredentialData.clientSecret as string | undefined
            //     const authUrl = decryptedCredentialData.authUrl as string
            //     const scope = decryptedCredentialData.scope as string
            //     let scopeArray: string[] = []
            //     try {
            //         scopeArray = JSON.parse(scope.replace(/\s/g, ''))
            //     } catch (e) {
            //         return res.status(500).send(e)
            //     }
            //
            //     const baseURL = req.get('host')
            //     const redirect_uri = `${req.secure ? 'https' : req.protocol}://${baseURL}/api/v1/oauth2/callback`
            //
            //     const oAuth2Parameters = {
            //         clientId: client_id,
            //         clientSecret: client_secret,
            //         accessTokenUri: accessTokenUrl,
            //         authorizationUri: authUrl,
            //         redirectUri: redirect_uri,
            //         scopes: scopeArray
            //     }
            //
            //     const oAuthObj = new ClientOAuth2(oAuth2Parameters)
            //
            //     const queryParameters = req.originalUrl.split('?').splice(1, 1).join('')
            //
            //     const oauthToken = await oAuthObj.code.getToken(`${oAuth2Parameters.redirectUri}?${queryParameters}`)
            //
            //     const { access_token, token_type, expires_in, refresh_token } = oauthToken.data
            //
            //     const body: ICredentialBody = {
            //         name: credential.name,
            //         nodeCredentialName: credential.nodeCredentialName,
            //         credentialData: {
            //             ...decryptedCredentialData,
            //             access_token,
            //             token_type,
            //             expires_in,
            //             refresh_token
            //         }
            //     }
            //
            //     const updateCredential = await transformToCredentialEntity(body)
            //
            //     this.AppDataSource.getRepository(Credential).merge(credential, updateCredential)
            //     await this.AppDataSource.getRepository(Credential).save(credential)

            return res.sendFile(getOAuth2HTMLPath())
        })

        this.app.get('/api/v1/oauth2-redirecturl', async (req: Request, res: Response) => {
            const baseURL = req.get('host')
            res.send(`${req.secure ? 'https' : req.protocol}://${baseURL}/api/v1/oauth2/callback`)
        })
    }
}

/**
 * Decrypt encrypted credentials with encryption key
 * @param {INodeData} nodeData
 * @param appDataSource
 */
export const decryptNodeCredentials = async (nodeData: INodeData, appDataSource: DataSource) => {
    if (nodeData.credentials && nodeData.credentials.registeredCredential) {
        // @ts-ignore
        const credentialId: string = nodeData.credentials.registeredCredential?.id

        const credential = await appDataSource.getRepository(Credential).findOneBy({
            id: credentialId
        })
        if (!credential) return

        const encryptKey = await getEncryptionKey()
        const decryptedCredentialData = decryptCredentialData(credential.encryptedData, encryptKey)

        nodeData.credentials = { ...nodeData.credentials, ...decryptedCredentialData }
    }
}

/**
 * Update reactFlowNodes so that resolveVariables is called, it is getting updated result
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {number} nodeIndex
 * @param {INodeExecutionData[]} newResult
 */
export const updateNodeOutput = (reactFlowNodes: IReactFlowNode[], nodeIndex: number, newResult: INodeExecutionData[] = []) => {
    if (reactFlowNodes[nodeIndex].data.outputResponses) {
        reactFlowNodes[nodeIndex].data.outputResponses = {
            ...reactFlowNodes[nodeIndex].data.outputResponses,
            output: newResult
        }
    } else {
        reactFlowNodes[nodeIndex].data.outputResponses = {
            submit: true,
            needRetest: null,
            output: newResult
        }
    }
}

/**
 * Test Workflow from starting node to end
 * @param {string} startingNodeId
 * @param {INodeExecutionData[]} startingNodeExecutedData
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IReactFlowEdge[]} reactFlowEdges
 * @param {INodeDirectedGraph} graph
 * @param {IComponentNodesPool} componentNodes
 * @param {string} clientId
 * @param {any} io
 * @param returnLastExecutedResult
 * @param dataSource
 */
export const testWorkflow = async (
    startingNodeId: string,
    startingNodeExecutedData: INodeExecutionData[],
    reactFlowNodes: IReactFlowNode[],
    reactFlowEdges: IReactFlowEdge[],
    graph: INodeDirectedGraph,
    componentNodes: IComponentNodesPool,
    clientId: string,
    io: any,
    dataSource: DataSource,
    returnLastExecutedResult?: boolean
) => {
    // Create a Queue and add our initial node in it
    const startingNodeIds = [startingNodeId]
    const startingNodeIndex = reactFlowNodes.findIndex((nd) => nd.id === startingNodeId)
    updateNodeOutput(reactFlowNodes, startingNodeIndex, startingNodeExecutedData)

    const nodeQueue = [] as INodeQueue[]
    const exploredNode = {} as IExploredNode
    // In the case of infinite loop, only max 3 loops will be executed
    const maxLoop = 3

    // Keep track of last executed result
    let lastExecutedResult: any

    for (let i = 0; i < startingNodeIds.length; i += 1) {
        nodeQueue.push({ nodeId: startingNodeIds[i], depth: 0 })
        exploredNode[startingNodeIds[i]] = { remainingLoop: maxLoop, lastSeenDepth: 0 }
    }

    while (nodeQueue.length) {
        const { nodeId, depth } = nodeQueue.shift() as INodeQueue
        const ignoreNodeIds: string[] = []

        if (!startingNodeIds.includes(nodeId)) {
            const reactFlowNode = reactFlowNodes.find((nd) => nd.id === nodeId)
            const nodeIndex = reactFlowNodes.findIndex((nd) => nd.id === nodeId)
            if (!reactFlowNode || nodeIndex < 0) continue

            try {
                const nodeInstanceFilePath = componentNodes[reactFlowNode.data.name].filePath
                const nodeModule = await import(nodeInstanceFilePath)
                const newNodeInstance = new nodeModule.nodeClass()

                await decryptNodeCredentials(reactFlowNode.data, dataSource)

                const reactFlowNodeData: INodeData[] = resolveVariables(reactFlowNode.data, reactFlowNodes)

                let results: INodeExecutionData[] = []

                for (let i = 0; i < reactFlowNodeData.length; i += 1) {
                    const result = await newNodeInstance.runWorkflow!.call(newNodeInstance, reactFlowNodeData[i])
                    checkOAuth2TokenRefreshed(result, reactFlowNodeData[i])
                    if (result) results.push(...result)
                }

                updateNodeOutput(reactFlowNodes, nodeIndex, results)

                // Determine which nodes to route next when it comes to ifElse
                if (results.length && nodeId.includes('ifElse')) {
                    let anchorIndex = -1
                    if (Array.isArray(results) && Object.keys((results as any)[0].data).length === 0) {
                        anchorIndex = 0
                    } else if (Array.isArray(results) && Object.keys((results as any)[1].data).length === 0) {
                        anchorIndex = 1
                    }
                    const ifElseEdge = reactFlowEdges.find(
                        (edg) => edg.source === nodeId && edg.sourceHandle === `${nodeId}-output-${anchorIndex}`
                    )
                    if (ifElseEdge) {
                        ignoreNodeIds.push(ifElseEdge.target)
                    }
                }

                const newWorkflowExecutedData = {
                    nodeId,
                    nodeLabel: reactFlowNode.data.label,
                    data: results,
                    status: 'FINISHED'
                } as IWorkflowExecutedData

                lastExecutedResult = results

                io.to(clientId).emit('testWorkflowNodeResponse', newWorkflowExecutedData)
            } catch (e: any) {
                console.error(e)
                const newWorkflowExecutedData = {
                    nodeId,
                    nodeLabel: reactFlowNode.data.label,
                    data: [{ error: e.message }],
                    status: 'ERROR'
                } as IWorkflowExecutedData

                lastExecutedResult = [{ error: e.message }]

                io.to(clientId).emit('testWorkflowNodeResponse', newWorkflowExecutedData)
                return
            }
        }

        const neighbourNodeIds = graph[nodeId]
        const nextDepth = depth + 1

        for (let i = 0; i < neighbourNodeIds.length; i += 1) {
            const neighNodeId = neighbourNodeIds[i]

            if (!ignoreNodeIds.includes(neighNodeId)) {
                // If nodeId has been seen, cycle detected
                if (Object.prototype.hasOwnProperty.call(exploredNode, neighNodeId)) {
                    const { remainingLoop, lastSeenDepth } = exploredNode[neighNodeId]

                    if (lastSeenDepth === nextDepth) continue

                    if (remainingLoop === 0) {
                        break
                    }
                    const remainingLoopMinusOne = remainingLoop - 1
                    exploredNode[neighNodeId] = { remainingLoop: remainingLoopMinusOne, lastSeenDepth: nextDepth }
                    nodeQueue.push({ nodeId: neighNodeId, depth: nextDepth })
                } else {
                    exploredNode[neighNodeId] = { remainingLoop: maxLoop, lastSeenDepth: nextDepth }
                    nodeQueue.push({ nodeId: neighNodeId, depth: nextDepth })
                }
            }
        }
    }
    io.to(clientId).emit('testWorkflowNodeFinish')

    if (returnLastExecutedResult) return lastExecutedResult
}
