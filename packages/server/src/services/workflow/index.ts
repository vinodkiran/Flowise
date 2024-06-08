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
} from '../../Interface'
import { ICommonObject, INodeData as INodeDataFromComponent, INodeData, INodeExecutionData } from 'flowise-components'
import {
    checkOAuth2TokenRefreshed,
    constructGraphs,
    constructGraphsAndGetStartingNodes,
    processWebhook,
    resolveVariables
} from '../../utils/workflow.utils'
import { DataSource } from 'typeorm'
import { databaseEntities, decryptCredentialData, getEncryptionKey } from '../../utils'
import { Credential } from '../../database/entities/Credential'
import { Webhook } from '../../database/entities/Webhook'
import { Execution } from '../../database/entities/Execution'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { getErrorMessage } from '../../errors/utils'
import { WorkFlow } from '../../database/entities/WorkFlow'
import { Server } from 'socket.io'
import { Request, Response } from 'express'

// ----------------------------------------
// Active Test Pools
// ----------------------------------------

// Remove active test triggers
const removeTestTriggers = () => {
    try {
        const appServer = getRunningExpressApp()
        if (appServer.activeTestTriggerPool) {
            appServer.activeTestTriggerPool.removeAll(appServer.nodesPool.componentNodes)
        }
        return 'OK'
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.removeTestTriggers - ${getErrorMessage(error)}`
        )
    }
}

// Remove active test webhooks
const removeTestWebhooks = () => {
    try {
        const appServer = getRunningExpressApp()
        if (appServer.activeTestWebhookPool) {
            appServer.activeTestWebhookPool.removeAll(appServer.nodesPool.componentNodes)
        }
        return 'success'
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.removeTestWebhooks - ${getErrorMessage(error)}`
        )
    }
}

// ----------------------------------------
// Workflows
// ----------------------------------------

// Get all workflows
const getWorkflows = async () => {
    try {
        const appServer = getRunningExpressApp()
        const workflows = await appServer.AppDataSource.getRepository(WorkFlow).find()
        const response: IWorkflowResponse[] = []
        for (const workflow of workflows) {
            let executionCount = await appServer.AppDataSource.getRepository(Execution).count({
                where: { workflowShortId: workflow.shortId }
            })
            response.push({
                ...workflow,
                executionCount,
                execution: []
            })
        }
        return response
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: workflowService.getWorkflows - ${getErrorMessage(error)}`)
    }
}

//Get specific workflow via shortId
const getWorkflowById = async (shortId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const workflow = await appServer.AppDataSource.getRepository(WorkFlow).findOneBy({ shortId })
        if (workflow) {
            let executions = await appServer.AppDataSource.getRepository(Execution).find({
                where: { workflowShortId: workflow.shortId }
            })
            let returnWorkflow: IWorkflowResponse = {
                ...workflow,
                executionCount: executions.length,
                execution: executions
            }
            return returnWorkflow
        }
        return `Workflow ${shortId} not found`
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.getWorkflowById - ${getErrorMessage(error)}`
        )
    }
}

// Create new workflow
const createWorkflow = async (body: any) => {
    try {
        const appServer = getRunningExpressApp()
        const newWorkflow = new WorkFlow()
        Object.assign(newWorkflow, body)

        const workflow = appServer.AppDataSource.getRepository(WorkFlow).create(newWorkflow)
        const results = await appServer.AppDataSource.getRepository(WorkFlow).save(workflow)
        return results
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.createWorkflow - ${getErrorMessage(error)}`
        )
    }
}

// Update workflow
const updateWorkflow = async (shortId: string, body: any) => {
    try {
        const appServer = getRunningExpressApp()
        const workflow = await appServer.AppDataSource.getRepository(WorkFlow).findOneBy({
            shortId: shortId
        })

        if (!workflow) {
            throw new Error(`Workflow ${shortId} not found`)
        }

        // If workflow is deployed, remove from deployedWorkflowsPool, then add it again for new changes to be picked up
        if (workflow.deployed && workflow.flowData) {
            const flowDataString = workflow.flowData
            const flowData: IReactFlowObject = JSON.parse(flowDataString)
            const reactFlowNodes = flowData.nodes as IReactFlowNode[]
            const reactFlowEdges = flowData.edges as IReactFlowEdge[]
            const workflowShortId = workflow.shortId

            const response = constructGraphsAndGetStartingNodes(reactFlowNodes, reactFlowEdges)

            if (response === undefined) return

            if (typeof response === 'string') {
                return response
            }
            const { startingNodeIds } = response

            await appServer.deployedWorkflowsPool.remove(
                startingNodeIds,
                reactFlowNodes,
                appServer.nodesPool.componentNodes,
                workflowShortId
            )
        }

        const updateWorkflow = new WorkFlow()
        Object.assign(updateWorkflow, body)

        appServer.AppDataSource.getRepository(WorkFlow).merge(workflow, updateWorkflow)
        const result = await appServer.AppDataSource.getRepository(WorkFlow).save(workflow)

        if (result) {
            let executions = await appServer.AppDataSource.getRepository(Execution).find({
                where: { workflowShortId: workflow.shortId }
            })

            const returnWorkflow: IWorkflowResponse = {
                ...result,
                executionCount: executions.length,
                execution: executions
            }
            if (returnWorkflow.deployed && returnWorkflow.flowData) {
                const flowData: IReactFlowObject = JSON.parse(returnWorkflow.flowData)
                const reactFlowNodes = flowData.nodes as IReactFlowNode[]
                const reactFlowEdges = flowData.edges as IReactFlowEdge[]
                const workflowShortId = returnWorkflow.shortId

                const response = constructGraphsAndGetStartingNodes(reactFlowNodes, reactFlowEdges)
                if (response === undefined) return
                if (typeof response === 'string') {
                    return response
                }

                const { graph, startingNodeIds } = response
                await appServer.deployedWorkflowsPool.add(
                    startingNodeIds,
                    graph,
                    reactFlowNodes,
                    appServer.nodesPool.componentNodes,
                    workflowShortId,
                    appServer.activeTestTriggerPool,
                    appServer.activeTestWebhookPool
                )
            }
            return returnWorkflow
        }
        throw new Error(`Workflow ${shortId} not found`)
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.updateWorkflow - ${getErrorMessage(error)}`
        )
    }
}

// Delete workflow via shortId
const deleteWorkflow = async (shortId: string) => {
    // If workflow is deployed, remove from deployedWorkflowsPool
    try {
        const appServer = getRunningExpressApp()
        const workflow = await appServer.AppDataSource.getRepository(WorkFlow).findOneBy({
            shortId
        })

        if (!workflow) {
            return `Workflow ${shortId} not found`
        }

        // If workflow is deployed, remove from deployedWorkflowsPool
        if (workflow.deployed && workflow.flowData) {
            const flowDataString = workflow.flowData
            const flowData: IReactFlowObject = JSON.parse(flowDataString)
            const reactFlowNodes = flowData.nodes as IReactFlowNode[]
            const reactFlowEdges = flowData.edges as IReactFlowEdge[]
            const workflowShortId = workflow.shortId

            const response = constructGraphsAndGetStartingNodes(reactFlowNodes, reactFlowEdges)
            if (response === undefined) return
            if (typeof response === 'string') {
                return response
            }
            const { startingNodeIds } = response

            await appServer.deployedWorkflowsPool.remove(
                startingNodeIds,
                reactFlowNodes,
                appServer.nodesPool.componentNodes,
                workflowShortId
            )
        }
        const results = await appServer.AppDataSource.getRepository(WorkFlow).delete({ shortId })
        await appServer.AppDataSource.getRepository(Webhook).delete({ workflowShortId: shortId })
        await appServer.AppDataSource.getRepository(Execution).delete({ workflowShortId: shortId })
        return results
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.deleteWorkflow - ${getErrorMessage(error)}`
        )
    }
}

// Deploy/Halt workflow via shortId
const deployWorkflow = async (shortId: string, body: any) => {
    try {
        const appServer = getRunningExpressApp()
        const workflow = await appServer.AppDataSource.getRepository(WorkFlow).findOneBy({
            shortId
        })

        if (!workflow) {
            return `Workflow ${shortId} not found`
        }

        const halt: boolean = body.halt
        const flowDataString = workflow.flowData
        const flowData: IReactFlowObject = JSON.parse(flowDataString)
        const reactFlowNodes = flowData.nodes as IReactFlowNode[]
        const reactFlowEdges = flowData.edges as IReactFlowEdge[]
        const workflowShortId = shortId

        const response = constructGraphsAndGetStartingNodes(reactFlowNodes, reactFlowEdges)
        if (response === undefined) return
        if (typeof response === 'string') {
            return response
        }
        const { graph, startingNodeIds } = response

        if (!halt) {
            await appServer.deployedWorkflowsPool.add(
                startingNodeIds,
                graph,
                reactFlowNodes,
                appServer.nodesPool.componentNodes,
                workflowShortId,
                appServer.activeTestTriggerPool,
                appServer.activeTestWebhookPool
            )
        } else {
            await appServer.deployedWorkflowsPool.remove(
                startingNodeIds,
                reactFlowNodes,
                appServer.nodesPool.componentNodes,
                workflowShortId
            )
        }

        body = { deployed: halt ? false : true }
        const updateWorkflow = new WorkFlow()
        Object.assign(updateWorkflow, body)

        appServer.AppDataSource.getRepository(WorkFlow).merge(workflow, updateWorkflow)
        const result = await appServer.AppDataSource.getRepository(WorkFlow).save(workflow)
        if (result) {
            let executions = await appServer.AppDataSource.getRepository(Execution).find({
                where: { workflowShortId: workflow.shortId }
            })

            const returnWorkflow: IWorkflowResponse = {
                ...result,
                executionCount: executions.length,
                execution: executions
            }
            return returnWorkflow
        }
        return `Workflow ${shortId} not found`
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: workflowService.deployWorkflow - ${getErrorMessage(error)}`)
    }
}

// Test a node
const testNode = async (name: string, body: ITestNodeBody) => {
    try {
        const appServer = getRunningExpressApp()
        const { nodes, edges, nodeId, clientId } = body

        const node = nodes.find((nd: IReactFlowNode) => nd.id === nodeId)

        if (!node) throw new Error(`Test node ${nodeId} not found`)

        if (Object.prototype.hasOwnProperty.call(appServer.nodesPool.componentNodes, name)) {
            try {
                const nodeInstance = appServer.nodesPool.componentNodes[name]
                const nodeType = nodeInstance.type
                const nodeData = node.data

                await decryptNodeCredentials(nodeData, appServer.AppDataSource)

                if (nodeType === 'action') {
                    let results: INodeExecutionData[] = []
                    const reactFlowNodeData: INodeData[] = resolveVariables(nodeData, nodes)
                    let options: ICommonObject = {}
                    options.appDataSource = appServer.AppDataSource
                    options.databaseEntities = databaseEntities
                    for (let i = 0; i < reactFlowNodeData.length; i += 1) {
                        const result = await nodeInstance.runWorkflow!.call(nodeInstance, reactFlowNodeData[i], options)
                        checkOAuth2TokenRefreshed(result, reactFlowNodeData[i])
                        if (result) results.push(...result)
                    }
                    return results
                } else if (nodeType === 'trigger') {
                    const triggerNodeInstance = nodeInstance as ITriggerNode
                    const emitEventKey = nodeId
                    nodeData.emitEventKey = emitEventKey
                    triggerNodeInstance.once(emitEventKey, async (result: INodeExecutionData[]) => {
                        await appServer.activeTestTriggerPool.remove(nodeData.name, appServer.nodesPool.componentNodes)
                        return result
                    })
                    await triggerNodeInstance.runTrigger!.call(triggerNodeInstance, nodeData)
                    appServer.activeTestTriggerPool.add(name, nodeData)
                } else if (nodeType === 'webhook') {
                    const webhookNodeInstance = nodeInstance as IWebhookNode
                    const newBody = {
                        webhookEndpoint: nodeData.webhookEndpoint,
                        httpMethod: (nodeData.inputParameters?.httpMethod as WebhookMethod) || 'POST'
                    } as any

                    if (webhookNodeInstance.webhookMethods?.createWebhook) {
                        if (!process.env.TUNNEL_BASE_URL) {
                            throw new Error(`Please enable tunnel by setting ENABLE_TUNNEL to true in env file`)
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

                    appServer.activeTestWebhookPool.add(
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

                    return newBody
                }
            } catch (error) {
                throw new Error(`Generic Node test error: ${error}`)
            }
        } else {
            throw new Error(`Node ${name} not found`)
        }
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: workflowService.haltWorkflow - ${getErrorMessage(error)}`)
    }
}

// Test Workflow from a starting point to end
const testWorkflowFromStart = async (startingNodeId: string, body: ITestWorkflowBody, ioServer: Server) => {
    try {
        const appServer = getRunningExpressApp()
        const nodes = body.nodes || []
        const edges = body.edges || []
        const clientId = body.clientId || ''

        const { graph } = constructGraphs(nodes, edges)

        const startNode = nodes.find((nd: IReactFlowNode) => nd.id === startingNodeId)

        if (startNode && startNode.data) {
            let nodeData = startNode.data as INodeDataFromComponent
            await decryptNodeCredentials(nodeData, appServer.AppDataSource)
            const nodeDataArray = resolveVariables(nodeData, nodes)
            nodeData = nodeDataArray[0]

            let componentNodes = appServer.nodesPool.componentNodes
            if (!Object.prototype.hasOwnProperty.call(componentNodes, nodeData.name)) {
                throw new Error(`Unable to test workflow from node: ${nodeData.name}`)
            }

            if (nodeData.type === 'trigger') {
                const triggerNodeInstance = componentNodes[nodeData.name] as ITriggerNode
                const emitEventKey = startingNodeId
                nodeData.emitEventKey = emitEventKey

                triggerNodeInstance.once(emitEventKey, async (result: INodeExecutionData[]) => {
                    await appServer.activeTestTriggerPool.remove(nodeData.name, componentNodes)

                    const newWorkflowExecutedData = {
                        nodeId: startingNodeId,
                        nodeLabel: nodeData.label,
                        data: result,
                        status: 'FINISHED'
                    } as IWorkflowExecutedData

                    ioServer.to(clientId).emit('testWorkflowNodeResponse', newWorkflowExecutedData)

                    await testWorkflow(
                        startingNodeId,
                        result,
                        nodes,
                        edges,
                        graph,
                        componentNodes,
                        clientId,
                        ioServer,
                        appServer.AppDataSource,
                        undefined
                    )
                })

                await triggerNodeInstance.runTrigger!.call(triggerNodeInstance, nodeData)
                appServer.activeTestTriggerPool.add(nodeData.name, nodeData)
            } else if (nodeData.type === 'webhook') {
                const webhookNodeInstance = componentNodes[nodeData.name] as IWebhookNode
                const newBody = {
                    webhookEndpoint: nodeData.webhookEndpoint,
                    httpMethod: (nodeData.inputParameters?.httpMethod as WebhookMethod) || 'POST'
                } as any

                if (webhookNodeInstance.webhookMethods?.createWebhook) {
                    if (!process.env.TUNNEL_BASE_URL) {
                        throw new Error(`Please enable tunnel by setting ENABLE_TUNNEL to true in env file`)
                    }

                    const webhookFullUrl = `${process.env.TUNNEL_BASE_URL}api/v1/workflows/webhook/${nodeData.webhookEndpoint}`
                    const webhookId = await webhookNodeInstance.webhookMethods?.createWebhook.call(
                        webhookNodeInstance,
                        nodeData,
                        webhookFullUrl
                    )

                    if (webhookId !== undefined) {
                        newBody.webhookId = webhookId
                    }
                }

                appServer.activeTestWebhookPool.add(
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
                let options: ICommonObject = {}
                options.appDataSource = appServer.AppDataSource
                options.databaseEntities = databaseEntities

                const result = await actionNodeInstance.runWorkflow!.call(actionNodeInstance, nodeData, options)
                checkOAuth2TokenRefreshed(result, nodeData)

                const newWorkflowExecutedData = {
                    nodeId: startingNodeId,
                    nodeLabel: nodeData.label,
                    data: result,
                    status: 'FINISHED'
                } as IWorkflowExecutedData

                ioServer.to(clientId).emit('testWorkflowNodeResponse', newWorkflowExecutedData)

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
                    ioServer,
                    appServer.AppDataSource
                )
            }
        }
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: workflowService.testWorkflow - ${getErrorMessage(error)}`)
    }
}

// ----------------------------------------
// Execution
// ----------------------------------------

// Get all executions
const getAllExecutions = async () => {
    try {
        const appServer = getRunningExpressApp()
        /* TODO: Query using relations */
        const executions = await appServer.AppDataSource.getRepository(Execution).find()
        const response: IExecutionResponse[] = []
        for (const execution of executions) {
            let workflow = await appServer.AppDataSource.getRepository(WorkFlow).findOneBy({ shortId: execution.workflowShortId })
            response.push({
                ...execution,
                workflow: workflow as IWorkFlow
            })
        }
        return response
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.getAllExecutions - ${getErrorMessage(error)}`
        )
    }
}

// Get specific execution via shortId
const getExecutionById = async (shortId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const execution = await appServer.AppDataSource.getRepository(Execution).findOneBy({ shortId })
        if (execution) {
            return execution
        }
        return `Execution ${shortId} not found`
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.getExecutionById - ${getErrorMessage(error)}`
        )
    }
}

// Create new execution
const createNewExecution = async (body: IExecution) => {
    try {
        const appServer = getRunningExpressApp()
        const newExecution = new Execution()
        Object.assign(newExecution, body)

        const execution = appServer.AppDataSource.getRepository(Execution).create(newExecution)
        const results = await appServer.AppDataSource.getRepository(Execution).save(execution)
        return results
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.createNewExecution - ${getErrorMessage(error)}`
        )
    }
}

// Update execution
const updateExecution = async (shortId: string, body: IExecution) => {
    try {
        const appServer = getRunningExpressApp()
        const execution = await appServer.AppDataSource.getRepository(Execution).findOneBy({
            shortId
        })

        if (!execution) {
            throw new Error(`Execution ${shortId} not found`)
        }

        const updateExecution = new Execution()
        Object.assign(updateExecution, body)

        appServer.AppDataSource.getRepository(Execution).merge(execution, updateExecution)
        const results = await appServer.AppDataSource.getRepository(Execution).save(execution)
        return results
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.updateExecution - ${getErrorMessage(error)}`
        )
    }
}

// Delete execution via shortId
const deleteExecution = async (shortId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const results = await appServer.AppDataSource.getRepository(Execution).delete({ shortId })
        return results
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.deleteExecution - ${getErrorMessage(error)}`
        )
    }
}

// ----------------------------------------
// Webhook
// ----------------------------------------

// GET webhook requests
const getWebhookRequests = async (webhookEndpoint: string) => {
    try {
        const appServer = getRunningExpressApp()
        const webhooks = await appServer.AppDataSource.getRepository(Webhook).find()
        return webhooks
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.getWebhookRequests - ${getErrorMessage(error)}`
        )
    }
}

const getWebhook = async (req: Request, res: Response) => {
    try {
        const appServer = getRunningExpressApp()
        const splitUrl = req.path.split('/webhook/')
        const webhookEndpoint = splitUrl[splitUrl.length - 1]
        const returnValue = await processWebhook(
            req,
            appServer.AppDataSource,
            webhookEndpoint,
            'GET',
            appServer.nodesPool.componentNodes,
            req.io,
            appServer.deployedWorkflowsPool,
            appServer.activeTestWebhookPool
        )
        return returnValue
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: workflowService.getWebhook - ${getErrorMessage(error)}`
        )
    }
}

const postWebhook = async (req: Request, res: Response) => {
    try {
        const appServer = getRunningExpressApp()
        const splitUrl = req.path.split('/webhook/')
        const webhookEndpoint = splitUrl[splitUrl.length - 1]
        const returnValue =  await processWebhook(
            req,
            appServer.AppDataSource,
            webhookEndpoint,
            'POST',
            appServer.nodesPool.componentNodes,
            req.io,
            appServer.deployedWorkflowsPool,
            appServer.activeTestWebhookPool
        )
        return returnValue
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: workflowService.postWebhook - ${getErrorMessage(error)}`)
    }
}

const getTunnelURL = () => {
    try {
        if (!process.env.TUNNEL_BASE_URL) throw new Error(`Tunnel URL not found`)
        return process.env.TUNNEL_BASE_URL
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: workflowService.getTunnelURL - ${getErrorMessage(error)}`)
    }
}

// ----------------------------------------
// TODO - OAuth2
// ----------------------------------------
const oAuth2 = async () => {
    // this.app.get('/api/v1/oauth2', async (req: Request, res: Response) => {
    //     if (!req.query.credentialId) return res.status(404).send('Credential not found')
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
    // return res.sendFile(getOAuth2HTMLPath())
}

const getOAuth2HTMLPath = (baseURL: string, isSecure: boolean) => {
    return `${isSecure ? 'https' : 'http'}://${baseURL}/api/v1/oauth2/callback`
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
                let options: ICommonObject = {}
                options.appDataSource = dataSource
                options.databaseEntities = databaseEntities

                for (let i = 0; i < reactFlowNodeData.length; i += 1) {
                    const result = await newNodeInstance.runWorkflow!.call(newNodeInstance, reactFlowNodeData[i], options)
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

export default {
    getWorkflows,
    getWorkflowById,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    deployWorkflow,
    testNode,
    testWorkflowFromStart,
    getAllExecutions,
    getExecutionById,
    createNewExecution,
    updateExecution,
    deleteExecution,
    getWebhookRequests,
    getWebhook,
    postWebhook,
    getTunnelURL,
    oAuth2,
    removeTestTriggers,
    removeTestWebhooks,
    getOAuth2HTMLPath
}
