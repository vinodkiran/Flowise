import moment from 'moment'
import {
    IComponentNodesPool,
    INodeDependencies,
    INodeDirectedGraph,
    IReactFlowEdge,
    IReactFlowNode,
    IReactFlowObject,
    IVariableDict,
    IWebhookNode, IWebhookResponse,
    IWorkflowExecutedData,
    WebhookMethod
} from "../Interface";
import lodash from 'lodash'
import { ICommonObject, INodeData as INodeDataFromComponent, INodeData, INodeExecutionData } from 'flowise-components'
import { DataSource } from 'typeorm'
import { Request, Response } from 'express'
import { DeployedWorkflowPool } from '../workflow/DeployedWorkflowPool'
import { ActiveTestWebhookPool } from '../workflow/ActiveTestWebhookPool'
import { decryptNodeCredentials, testWorkflow } from '../services/workflow'
import { Webhook } from '../database/entities/Webhook'
import { WorkFlow } from '../database/entities/WorkFlow'
import path from 'path'

export enum ShortIdConstants {
    WORKFLOW_ID_PREFIX = 'W',
    EXECUTION_ID_PREFIX = 'E'
}

const RANDOM_LENGTH = 8
const DICTIONARY_1 = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const DICTIONARY_3 = 'abcdefghijklmnopqrstuvwxyz0123456789'

/**
 * Returns a Short ID
 * Format : WDDMMMYY-[0-1A-Z]*8 , ie:  B10JAN21-2CH9PX8N
 * Where W=Entity Prefix, DD=DAY, MMM=Month, YY=Year, -=Separator (hyphen character), [0-1A-Z]*8 = random part of length 8 by default.
 *
 * @param {string | Date} prefix Identifies the Entity, 'W' for Workflow, 'E' for Execution
 * @param {Date} date The Date the ShortId was created
 * @returns {string} shortId
 */
export const shortId = (prefix: 'W' | 'E', date: string | Date): string => {
    const isValidPrefix = prefix === 'W' || prefix === 'E'
    const utcCreatedAt = new Date(date)
    if (!isValidPrefix) throw new Error('Invalid short id prefix, only possible values "W" or "E".')
    const DICTIONARY = DICTIONARY_1
    let randomPart = ''
    for (let i = 0; i < RANDOM_LENGTH; i++) {
        randomPart += getRandomCharFromDictionary(DICTIONARY)
    }
    const sanitizedDate = formatDateForShortID(utcCreatedAt)
    return `${prefix}${sanitizedDate}-${randomPart}`
}

/**
 * Format a date for use in the short id DDMMMYY with no hyphens
 * @param {Date} date
 * @returns {string} the sanitized date as string ie: 10JAN21
 */
export const formatDateForShortID = (date: Date): string => {
    const localDate = moment(date)
    return localDate.format('DDMMMYY').toUpperCase()
}

export const getRandomCharFromDictionary = (dictionary: string) => {
    const minDec = 0
    const maxDec = dictionary.length + 1
    const randDec = Math.floor(Math.random() * (maxDec - minDec) + minDec)
    return dictionary.charAt(randDec)
}

export const getRandomSubdomain = () => {
    let randomPart = ''
    for (let i = 0; i < 24; i++) {
        randomPart += getRandomCharFromDictionary(DICTIONARY_3)
    }
    return randomPart
}

/**
 * Get variable value from outputResponses.output
 * @param {string} paramValue
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {string} key
 * @param {number} loopIndex
 * @returns {string}
 */
export const getVariableValue = (paramValue: string, reactFlowNodes: IReactFlowNode[], key: string, loopIndex: number): string => {
    let returnVal = paramValue
    const variableStack = []
    const variableDict = {} as IVariableDict
    let startIdx = 0
    const endIdx = returnVal.length - 1

    while (startIdx < endIdx) {
        const substr = returnVal.substring(startIdx, startIdx + 2)

        // Store the opening double curly bracket
        if (substr === '{{') {
            variableStack.push({ substr, startIdx: startIdx + 2 })
        }

        // Found the complete variable
        if (substr === '}}' && variableStack.length > 0 && variableStack[variableStack.length - 1].substr === '{{') {
            const variableStartIdx = variableStack[variableStack.length - 1].startIdx
            const variableEndIdx = startIdx
            const variableFullPath = returnVal.substring(variableStartIdx, variableEndIdx)

            // Split by first occurrence of '[' to get just nodeId
            const [variableNodeId, ...rest] = variableFullPath.split('[')
            let variablePath = 'outputResponses.output' + '[' + rest.join('[')
            if (variablePath.includes('$index')) {
                variablePath = variablePath.split('$index').join(loopIndex.toString())
            }

            const executedNode = reactFlowNodes.find((nd) => nd.id === variableNodeId)
            if (executedNode) {
                const resolvedVariablePath = getVariableValue(variablePath, reactFlowNodes, key, loopIndex)
                const variableValue = lodash.get(executedNode.data, resolvedVariablePath)
                variableDict[`{{${variableFullPath}}}`] = variableValue
                // For instance: const var1 = "some var"
                if (key === 'code' && typeof variableValue === 'string') variableDict[`{{${variableFullPath}}}`] = `"${variableValue}"`
                if (key === 'code' && typeof variableValue === 'object')
                    variableDict[`{{${variableFullPath}}}`] = `${JSON.stringify(variableValue)}`
            }
            variableStack.pop()
        }
        startIdx += 1
    }

    const variablePaths = Object.keys(variableDict)
    variablePaths.sort() // Sort by length of variable path because longer path could possibly contains nested variable
    variablePaths.forEach((path) => {
        const variableValue = variableDict[path]
        // Replace all occurrence
        returnVal = returnVal.split(path).join(variableValue)
    })

    return returnVal
}

/**
 * Get minimum variable array length from outputResponses.output
 * @param {string} paramValue
 * @param {IReactFlowNode[]} reactFlowNodes
 * @returns {number}
 */
export const getVariableLength = (paramValue: string, reactFlowNodes: IReactFlowNode[]): number => {
    let minLoop = Infinity
    const variableStack = []
    let startIdx = 0
    const endIdx = paramValue.length - 1

    while (startIdx < endIdx) {
        const substr = paramValue.substring(startIdx, startIdx + 2)

        // Store the opening double curly bracket
        if (substr === '{{') {
            variableStack.push({ substr, startIdx: startIdx + 2 })
        }

        // Found the complete variable
        if (substr === '}}' && variableStack.length > 0 && variableStack[variableStack.length - 1].substr === '{{') {
            const variableStartIdx = variableStack[variableStack.length - 1].startIdx
            const variableEndIdx = startIdx
            const variableFullPath = paramValue.substring(variableStartIdx, variableEndIdx)

            if (variableFullPath.includes('$index')) {
                // Split by first occurrence of '[' to get just nodeId
                const [variableNodeId, ...rest] = variableFullPath.split('[')
                const variablePath = 'outputResponses.output' + '[' + rest.join('[')
                const [variableArrayPath, ..._] = variablePath.split('[$index]')

                const executedNode = reactFlowNodes.find((nd) => nd.id === variableNodeId)
                if (executedNode) {
                    const variableValue = lodash.get(executedNode.data, variableArrayPath)
                    if (Array.isArray(variableValue)) minLoop = Math.min(minLoop, variableValue.length)
                }
            }
            variableStack.pop()
        }
        startIdx += 1
    }
    return minLoop
}

/**
 * Loop through each input and resolve variable if necessary
 * @param {INodeData} reactFlowNodeData
 * @param {IReactFlowNode[]} reactFlowNodes
 * @returns {INodeData}
 */
export const resolveVariables = (reactFlowNodeData: INodeData, reactFlowNodes: IReactFlowNode[]): INodeDataFromComponent[] => {
    const flowNodeDataArray: INodeData[] = []
    const flowNodeData = lodash.cloneDeep(reactFlowNodeData)
    const types = ['actions', 'networks', 'inputParameters']

    const getMinForLoop = (paramsObj: ICommonObject) => {
        let minLoop = Infinity
        for (const key in paramsObj) {
            const paramValue = paramsObj[key]
            if (typeof paramValue === 'string' && paramValue.includes('$index')) {
                // node.data[$index].smtg
                minLoop = Math.min(minLoop, getVariableLength(paramValue, reactFlowNodes))
            }
            if (Array.isArray(paramValue)) {
                for (let j = 0; j < paramValue.length; j += 1) {
                    minLoop = Math.min(minLoop, getMinForLoop(paramValue[j] as ICommonObject))
                }
            }
        }
        return minLoop
    }

    const getParamValues = (paramsObj: ICommonObject, loopIndex: number) => {
        for (const key in paramsObj) {
            const paramValue = paramsObj[key]

            if (typeof paramValue === 'string') {
                const resolvedValue = getVariableValue(paramValue, reactFlowNodes, key, loopIndex)
                paramsObj[key] = resolvedValue
            }

            if (typeof paramValue === 'number') {
                const paramValueStr = paramValue.toString()
                const resolvedValue = getVariableValue(paramValueStr, reactFlowNodes, key, loopIndex)
                paramsObj[key] = resolvedValue
            }

            if (Array.isArray(paramValue)) {
                for (let j = 0; j < paramValue.length; j += 1) {
                    getParamValues(paramValue[j] as ICommonObject, loopIndex)
                }
            }
        }
    }

    let minLoop = Infinity
    for (let i = 0; i < types.length; i += 1) {
        const paramsObj = (flowNodeData as any)[types[i]]
        minLoop = Math.min(minLoop, getMinForLoop(paramsObj))
    }

    if (minLoop === Infinity) {
        for (let i = 0; i < types.length; i += 1) {
            const paramsObj = (flowNodeData as any)[types[i]]
            getParamValues(paramsObj, -1)
        }
        return [flowNodeData]
    } else {
        for (let j = 0; j < minLoop; j += 1) {
            const clonedFlowNodeData = lodash.cloneDeep(flowNodeData)
            for (let i = 0; i < types.length; i += 1) {
                const paramsObj = (clonedFlowNodeData as any)[types[i]]
                getParamValues(paramsObj, j)
            }
            flowNodeDataArray.push(clonedFlowNodeData)
        }
        return flowNodeDataArray
    }
}

/**
 * Check if oAuth2 token refreshed
 * @param {INodeExecutionData[] | null} result
 * @param {INodeData} nodeData
 * @param {DataSource} appDataSource
 */
export const checkOAuth2TokenRefreshed = (result: INodeExecutionData[] | null, nodeData: INodeData, appDataSource?: DataSource) => {
    const credentialMethod = nodeData.credentials?.credentialMethod as string
    if (credentialMethod && credentialMethod.toLowerCase().includes('oauth2')) {
        //updateCredentialAfterOAuth2TokenRefreshed(result, nodeData, appDataSource)
    }
}

/**
 * Construct directed graph and node dependencies score
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IReactFlowEdge[]} reactFlowEdges
 */
export const constructGraphs = (reactFlowNodes: IReactFlowNode[], reactFlowEdges: IReactFlowEdge[]) => {
    const nodeDependencies = {} as INodeDependencies
    const graph = {} as INodeDirectedGraph

    for (let i = 0; i < reactFlowNodes.length; i += 1) {
        const nodeId = reactFlowNodes[i].id
        nodeDependencies[nodeId] = 0
        graph[nodeId] = []
    }

    for (let i = 0; i < reactFlowEdges.length; i += 1) {
        const source = reactFlowEdges[i].source
        const target = reactFlowEdges[i].target

        if (Object.prototype.hasOwnProperty.call(graph, source)) {
            graph[source].push(target)
        } else {
            graph[source] = [target]
        }
        nodeDependencies[target] += 1
    }

    return { graph, nodeDependencies }
}

// /**
//  * Transform ICredentialBody from req to Credential entity
//  * @returns {Credential}
//  * @param body
//  */
// export const transformToCredentialEntity = async (body: ICredentialBody): Promise<Credential> => {
//     const credentialBody = {
//         name: body.name,
//         nodeCredentialName: body.nodeCredentialName,
//         credentialData: encryptCredentialData(body.credentialData)
//     }
//
//     const newCredential = new Credential()
//     Object.assign(newCredential, credentialBody)
//
//     return newCredential
// }

/**
 * Get starting node and check if flow is valid
 * @param {INodeDependencies} nodeDependencies
 * @param {IReactFlowNode[]} reactFlowNodes
 */
export const getStartingNode = (nodeDependencies: INodeDependencies, reactFlowNodes: IReactFlowNode[]) => {
    // Find starting node
    const startingNodeIds = [] as string[]
    Object.keys(nodeDependencies).forEach((nodeId) => {
        if (nodeDependencies[nodeId] === 0) {
            startingNodeIds.push(nodeId)
        }
    })

    // Action nodes with 0 dependencies are not valid, must connected to source
    const faultyNodeLabels = []
    for (let i = 0; i < startingNodeIds.length; i += 1) {
        const node = reactFlowNodes.find((nd) => nd.id === startingNodeIds[i])

        if (node && node.data && node.data.type && node.data.type !== 'trigger' && node.data.type !== 'webhook') {
            faultyNodeLabels.push(node.data.label)
        }
    }

    return { faultyNodeLabels, startingNodeIds }
}

/**
 * Function to get both graphs and starting nodes
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IReactFlowEdge[]} reactFlowEdges
 */
export const constructGraphsAndGetStartingNodes = (reactFlowNodes: IReactFlowNode[], reactFlowEdges: IReactFlowEdge[]) => {
    const { graph, nodeDependencies } = constructGraphs(reactFlowNodes, reactFlowEdges)
    const { faultyNodeLabels, startingNodeIds } = getStartingNode(nodeDependencies, reactFlowNodes)
    if (faultyNodeLabels.length) {
        let message = `Action nodes must connected to source. Faulty nodes: `
        for (let i = 0; i < faultyNodeLabels.length; i += 1) {
            message += `${faultyNodeLabels[i]}`
            if (i !== faultyNodeLabels.length - 1) {
                message += ', '
            }
        }
        return message
    }

    return { graph, startingNodeIds }
}

/**
 * Process webhook
 * @param {Response} res
 * @param {Request} req
 * @param {DataSource} AppDataSource
 * @param {string} webhookEndpoint
 * @param {WebhookMethod} httpMethod
 * @param {IComponentNodesPool} componentNodes
 * @param {any} io
 * @param deployedWorkflowsPool
 * @param activeTestWebhooksPool
 */
export const processWebhook = async (
    req: Request,
    AppDataSource: DataSource,
    webhookEndpoint: string,
    httpMethod: WebhookMethod,
    componentNodes: IComponentNodesPool,
    io: any,
    deployedWorkflowsPool: DeployedWorkflowPool,
    activeTestWebhooksPool: ActiveTestWebhookPool): Promise<IWebhookResponse> => {
    try {
        // Find if webhook is in activeTestWebhookPool
        const testWebhookKey = `${webhookEndpoint}_${httpMethod}`
        if (Object.prototype.hasOwnProperty.call(activeTestWebhooksPool.activeTestWebhooks, testWebhookKey)) {
            const { nodes, edges, nodeData, clientId, isTestWorkflow, webhookNodeId } =
                activeTestWebhooksPool.activeTestWebhooks[testWebhookKey]
            const webhookNodeInstance = componentNodes[nodeData.name] as IWebhookNode

            await decryptNodeCredentials(nodeData, AppDataSource)

            if (!isTestWorkflow) {
                // TODO: Temporary Hack to fix the issue with runWebhook
                ;(nodeData as any).req = req
                const result = await webhookNodeInstance.runWebhook!.call(webhookNodeInstance, nodeData)

                if (result === null) {
                    return {
                        statusCode: 200,
                        responseBody: 'OK!',
                        responseType: 'text'
                    }
                }

                // Emit webhook result
                io.to(clientId).emit('testWebhookNodeResponse', result)

                // Delete webhook from 3rd party apps and from pool
                activeTestWebhooksPool.remove(testWebhookKey, componentNodes)

                const webhookResponseCode = (nodeData.inputParameters?.responseCode as number) || 200
                if ((nodeData.inputParameters?.returnType as string) === 'lastNodeResponse') {
                    const webhookResponseData = result || []
                    return {
                        statusCode: webhookResponseCode,
                        responseBody: webhookResponseData,
                        responseType: 'json'
                    }
                    //return res.status(webhookResponseCode).json(webhookResponseData)
                } else {
                    // @ts-ignore
                    const webhookResponseData = (nodeData.inputParameters?.responseData as string) || `Webhook ${req.originalUrl} received!`
                    return {
                        statusCode: webhookResponseCode,
                        responseBody: webhookResponseData,
                        responseType: 'json'
                    }
                    //return res.status(webhookResponseCode).send(webhookResponseData)
                }
            } else {
                // TODO: Temporary Hack to fix the issue with runWebhook
                ;(nodeData as any).req = req
                const result = await webhookNodeInstance.runWebhook!.call(webhookNodeInstance, nodeData)

                if (result === null) {
                    return {
                         statusCode: 200,
                        responseBody: 'OK!',
                        responseType: 'text'
                    }
                    //return res.status(200).send('OK!')
                }

                const newWorkflowExecutedData = {
                    nodeId: webhookNodeId,
                    nodeLabel: nodeData.label,
                    data: result,
                    status: 'FINISHED'
                } as IWorkflowExecutedData

                io.to(clientId).emit('testWorkflowNodeResponse', newWorkflowExecutedData)

                // Delete webhook from 3rd party apps and from pool
                await activeTestWebhooksPool.remove(testWebhookKey, componentNodes)

                const { graph } = constructGraphs(nodes, edges)

                const webhookResponseCode = (nodeData.inputParameters?.responseCode as number) || 200
                if ((nodeData.inputParameters?.returnType as string) === 'lastNodeResponse') {
                    const lastExecutedResult = await testWorkflow(
                        webhookNodeId,
                        result.length ? [{ data: result[0].data }] : [],
                        nodes,
                        edges,
                        graph,
                        componentNodes,
                        clientId,
                        io,
                        AppDataSource,
                        true
                    )
                    const webhookResponseData = lastExecutedResult || []
                    return {
                        statusCode: webhookResponseCode,
                        responseBody: webhookResponseData,
                        responseType: 'json'
                    }
                    //return res.status(webhookResponseCode).json(webhookResponseData)
                } else {
                    await testWorkflow(
                        webhookNodeId,
                        result.length ? [{ data: result[0].data }] : [],
                        nodes,
                        edges,
                        graph,
                        componentNodes,
                        clientId,
                        io,
                        AppDataSource
                    )
                    // @ts-ignore
                    const webhookResponseData = (nodeData.inputParameters?.responseData as string) || `Webhook ${req.originalUrl} received!`
                    return {
                        statusCode: webhookResponseCode,
                        responseBody: webhookResponseData,
                        responseType: 'text'
                    }
                    //return res.status(webhookResponseCode).send(webhookResponseData)
                }
            }
        } else {
            const webhook = await AppDataSource.getRepository(Webhook).findOneBy({
                webhookEndpoint,
                httpMethod
            })

            if (!webhook) {
                // @ts-ignore
                return {
                    statusCode: 404,
                    responseBody: `Webhook ${req.originalUrl} not found`,
                    responseType: 'error'
                }
                //res.status(404).send(`Webhook ${req.originalUrl} not found`)
            }

            const nodeId = webhook.nodeId
            const workflowShortId = webhook.workflowShortId

            const workflow = await AppDataSource.getRepository(WorkFlow).findOneBy({
                shortId: workflowShortId
            })

            if (!workflow) {
                return {
                    statusCode: 404,
                    responseBody: `Workflow ${workflowShortId} not found`,
                    responseType: 'error'
                }
                //res.status(404).send(`Workflow ${workflowShortId} not found`)
            }

            const flowDataString = workflow.flowData
            const flowData: IReactFlowObject = JSON.parse(flowDataString)
            const reactFlowNodes = flowData.nodes as IReactFlowNode[]
            const reactFlowEdges = flowData.edges as IReactFlowEdge[]

            const reactFlowNode = reactFlowNodes.find((nd) => nd.id === nodeId)

            if (!reactFlowNode) {
                return {
                    statusCode: 404,
                    responseBody: `Node ${nodeId} not found`,
                    responseType: 'error'
                }
                //res.status(404).send(`Node ${nodeId} not found`)
            }

            const nodeData = reactFlowNode.data
            const nodeName = nodeData.name

            // Start workflow
            const { graph, nodeDependencies } = constructGraphs(reactFlowNodes, reactFlowEdges)
            const { faultyNodeLabels, startingNodeIds } = getStartingNode(nodeDependencies, reactFlowNodes)
            if (faultyNodeLabels.length) {
                let message = `Action nodes must connected to source. Faulty nodes: `
                for (let i = 0; i < faultyNodeLabels.length; i += 1) {
                    message += `${faultyNodeLabels[i]}`
                    if (i !== faultyNodeLabels.length - 1) {
                        message += ', '
                    }
                }
                return {
                    statusCode: 500,
                    responseBody: message,
                    responseType: 'error'
                }
//                res.status(500).send(message)
            }

            const nodeInstance = componentNodes[nodeName]
            const webhookNode = nodeInstance as IWebhookNode
            // TODO: Temporary Hack to fix the issue with runWebhook
            ;(nodeData as any).req = req
            const result = (await webhookNode.runWebhook!.call(webhookNode, nodeData)) || []

            if (result === null) {
                return {
                    statusCode: 200,
                    responseBody: 'OK!',
                    responseType: 'text'
                }
                //return res.status(200).send('OK!')
            }

            const webhookResponseCode = (nodeData.inputParameters?.responseCode as number) || 200

            const workflowExecutedData = (await deployedWorkflowsPool.startWorkflow(
                workflowShortId,
                reactFlowNode,
                reactFlowNode.id,
                result,
                componentNodes,
                startingNodeIds,
                graph
            )) as unknown as IWorkflowExecutedData[]
            if ((nodeData.inputParameters?.returnType as string) === 'lastNodeResponse') {
                const lastExecutedResult = workflowExecutedData[workflowExecutedData.length - 1]
                const webhookResponseData = lastExecutedResult?.data || []
                return {
                    statusCode: webhookResponseCode,
                    responseBody: webhookResponseData,
                    responseType: 'json'
                }
                //return res.status(webhookResponseCode).json(webhookResponseData)
            } else {
                // @ts-ignore
                const webhookResponseData = (nodeData.inputParameters?.responseData as string) || `Webhook ${req.originalUrl} received!`
                return {
                    statusCode: webhookResponseCode,
                    responseBody: webhookResponseData,
                    responseType: 'text'
                }
                //return res.status(webhookResponseCode).send(webhookResponseData)
            }
        }
    } catch (error) {
        return {
            statusCode: 500,
            responseBody: `Webhook error: ${error}`,
            responseType: 'error'
        }
        //res.status(500).send(`Webhook error: ${error}`)
    }
}

/**
 * Returns the path of oauth2 html
 * @returns {string}
 */
export const getOAuth2HTMLPath = (): string => {
    return path.join(__dirname, '..', '..', 'oauth2.html')
}
