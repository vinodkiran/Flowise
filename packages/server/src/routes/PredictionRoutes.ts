import express, { NextFunction, Request, Response } from 'express'

import { ChatFlow } from '../database/entities/ChatFlow'
import { getRateLimiter } from '../utils/rateLimit'
import { Server } from 'socket.io'
import logger from '../utils/logger'
import { v4 as uuidv4 } from 'uuid'

import {
    chatType,
    IChatMessage,
    IDepthQueue,
    IMessage,
    IncomingInput,
    INodeData,
    IReactFlowEdge,
    IReactFlowNode,
    IReactFlowObject
} from '../Interface'
import { validateKey } from '../utils/apiKey'
import { ICommonObject } from 'flowise-components'
import fs from 'fs'
import {
    buildLangchain,
    checkMemorySessionId,
    constructGraphs,
    databaseEntities,
    getEndingNodes,
    getStartingNodes,
    isFlowValidForStream,
    isSameOverrideConfig,
    isStartNodeDependOnInput,
    mapMimeTypeToInputField,
    replaceChatHistory,
    replaceInputsWithConfig,
    resolveVariables
} from '../utils'
import { ChatMessage } from '../database/entities/ChatMessage'
import { AbstractRoutes } from './AbstractRoutes'

export class PredictionRoutes extends AbstractRoutes {
    get socketIO(): Server {
        return this._socketIO
    }

    set socketIO(value: Server) {
        this._socketIO = value
    }
    private _socketIO: Server

    constructor(app: express.Application) {
        super(app)
    }

    // ----------------------------------------
    // Prediction
    // ----------------------------------------
    configureRoutes() {
        // Send input message and get prediction result (External)
        this.app.post(
            '/api/v1/prediction/:id',
            this.uploads.array('files'),
            (req: Request, res: Response, next: NextFunction) => getRateLimiter(req, res, next),
            async (req: Request, res: Response) => {
                await this.buildChatflow(req, res, this._socketIO)
            }
        )

        // Send input message and get prediction result (Internal)
        this.app.post('/api/v1/internal-prediction/:id', async (req: Request, res: Response) => {
            await this.buildChatflow(req, res, this._socketIO, true)
        })
    }

    /**
     * Build Chatflow
     * @param {Request} req
     * @param {Response} res
     * @param {Server} socketIO
     * @param {boolean} isInternal
     * @param {boolean} isUpsert
     */
    async buildChatflow(req: Request, res: Response, socketIO?: Server, isInternal: boolean = false) {
        try {
            const chatflowid = req.params.id
            let incomingInput: IncomingInput = req.body

            let nodeToExecuteData: INodeData

            const chatflow = await this.AppDataSource.getRepository(ChatFlow).findOneBy({
                id: chatflowid
            })
            if (!chatflow) return res.status(404).send(`Chatflow ${chatflowid} not found`)

            const chatId = incomingInput.chatId ?? incomingInput.overrideConfig?.sessionId ?? uuidv4()
            const userMessageDateTime = new Date()

            if (!isInternal) {
                const isKeyValidated = await validateKey(req, chatflow)
                if (!isKeyValidated) return res.status(401).send('Unauthorized')
            }

            let isStreamValid = false

            const files = (req.files as any[]) || []

            if (files.length) {
                const overrideConfig: ICommonObject = { ...req.body }
                for (const file of files) {
                    const fileData = fs.readFileSync(file.path, { encoding: 'base64' })
                    const dataBase64String = `data:${file.mimetype};base64,${fileData},filename:${file.filename}`

                    const fileInputField = mapMimeTypeToInputField(file.mimetype)
                    if (overrideConfig[fileInputField]) {
                        overrideConfig[fileInputField] = JSON.stringify([...JSON.parse(overrideConfig[fileInputField]), dataBase64String])
                    } else {
                        overrideConfig[fileInputField] = JSON.stringify([dataBase64String])
                    }
                }
                incomingInput = {
                    question: req.body.question ?? 'hello',
                    overrideConfig,
                    history: [],
                    socketIOClientId: req.body.socketIOClientId
                }
            }

            /*** Get chatflows and prepare data  ***/
            const flowData = chatflow.flowData
            const parsedFlowData: IReactFlowObject = JSON.parse(flowData)
            const nodes = parsedFlowData.nodes
            const edges = parsedFlowData.edges

            /*   Reuse the flow without having to rebuild (to avoid duplicated upsert, recomputation, reinitialization of memory) when all these conditions met:
             * - Node Data already exists in pool
             * - Still in sync (i.e the flow has not been modified since)
             * - Existing overrideConfig and new overrideConfig are the same
             * - Flow doesn't start with/contain nodes that depend on incomingInput.question
             * - Its not an Upsert request
             * TODO: convert overrideConfig to hash when we no longer store base64 string but filepath
             ***/
            const isFlowReusable = () => {
                return (
                    Object.prototype.hasOwnProperty.call(this.chatflowPool.activeChatflows, chatflowid) &&
                    this.chatflowPool.activeChatflows[chatflowid].inSync &&
                    this.chatflowPool.activeChatflows[chatflowid].endingNodeData &&
                    isSameOverrideConfig(
                        isInternal,
                        this.chatflowPool.activeChatflows[chatflowid].overrideConfig,
                        incomingInput.overrideConfig
                    ) &&
                    !isStartNodeDependOnInput(this.chatflowPool.activeChatflows[chatflowid].startingNodes, nodes)
                )
            }

            if (isFlowReusable()) {
                nodeToExecuteData = this.chatflowPool.activeChatflows[chatflowid].endingNodeData as INodeData
                isStreamValid = isFlowValidForStream(nodes, nodeToExecuteData)
                logger.debug(
                    `[server]: Reuse existing chatflow ${chatflowid} with ending node ${nodeToExecuteData.label} (${nodeToExecuteData.id})`
                )
            } else {
                /*** Get Ending Node with Directed Graph  ***/
                const { graph, nodeDependencies } = constructGraphs(nodes, edges)
                const directedGraph = graph
                const endingNodeIds = getEndingNodes(nodeDependencies, directedGraph)
                if (!endingNodeIds.length) return res.status(500).send(`Ending nodes not found`)

                const endingNodes = nodes.filter((nd) => endingNodeIds.includes(nd.id))
                for (const endingNode of endingNodes) {
                    const endingNodeData = endingNode.data
                    if (!endingNodeData) return res.status(500).send(`Ending node ${endingNode.id} data not found`)

                    if (endingNodeData && endingNodeData.category !== 'Chains' && endingNodeData.category !== 'Agents') {
                        return res.status(500).send(`Ending node must be either a Chain or Agent`)
                    }

                    if (
                        endingNodeData.outputs &&
                        Object.keys(endingNodeData.outputs).length &&
                        !Object.values(endingNodeData.outputs).includes(endingNodeData.name)
                    ) {
                        return res
                            .status(500)
                            .send(
                                `Output of ${endingNodeData.label} (${endingNodeData.id}) must be ${endingNodeData.label}, can't be an Output Prediction`
                            )
                    }

                    isStreamValid = isFlowValidForStream(nodes, endingNodeData)
                }

                let chatHistory: IMessage[] | string = incomingInput.history

                // When {{chat_history}} is used in Prompt Template, fetch the chat conversations from memory
                for (const endingNode of endingNodes) {
                    const endingNodeData = endingNode.data
                    if (!endingNodeData.inputs?.memory) continue
                    if (
                        endingNodeData.inputs?.memory &&
                        !incomingInput.history &&
                        (incomingInput.chatId || incomingInput.overrideConfig?.sessionId)
                    ) {
                        const memoryNodeId = endingNodeData.inputs?.memory.split('.')[0].replace('{{', '')
                        const memoryNode = nodes.find((node) => node.data.id === memoryNodeId)
                        if (memoryNode) {
                            chatHistory = await replaceChatHistory(memoryNode, incomingInput, this.AppDataSource, databaseEntities, logger)
                        }
                    }
                }

                /*** Get Starting Nodes with Reversed Graph ***/
                const constructedObj = constructGraphs(nodes, edges, { isReversed: true })
                const nonDirectedGraph = constructedObj.graph
                let startingNodeIds: string[] = []
                let depthQueue: IDepthQueue = {}
                for (const endingNodeId of endingNodeIds) {
                    const res = getStartingNodes(nonDirectedGraph, endingNodeId)
                    startingNodeIds.push(...res.startingNodeIds)
                    depthQueue = Object.assign(depthQueue, res.depthQueue)
                }
                startingNodeIds = [...new Set(startingNodeIds)]

                const startingNodes = nodes.filter((nd) => startingNodeIds.includes(nd.id))

                logger.debug(`[server]: Start building chatflow ${chatflowid}`)
                /*** BFS to traverse from Starting Nodes to Ending Node ***/
                const reactFlowNodes = await buildLangchain(
                    startingNodeIds,
                    nodes,
                    edges,
                    graph,
                    depthQueue,
                    this.nodesPool.componentNodes,
                    incomingInput.question,
                    chatHistory,
                    chatId,
                    chatflowid,
                    this.AppDataSource,
                    incomingInput?.overrideConfig,
                    this.cachePool
                )

                const nodeToExecute =
                    endingNodeIds.length === 1
                        ? reactFlowNodes.find((node: IReactFlowNode) => endingNodeIds[0] === node.id)
                        : reactFlowNodes[reactFlowNodes.length - 1]
                if (!nodeToExecute) return res.status(404).send(`Node not found`)

                if (incomingInput.overrideConfig) {
                    nodeToExecute.data = replaceInputsWithConfig(nodeToExecute.data, incomingInput.overrideConfig)
                }

                const reactFlowNodeData: INodeData = resolveVariables(
                    nodeToExecute.data,
                    reactFlowNodes,
                    incomingInput.question,
                    chatHistory
                )
                nodeToExecuteData = reactFlowNodeData

                this.chatflowPool.add(chatflowid, nodeToExecuteData, startingNodes, incomingInput?.overrideConfig)
            }

            logger.debug(`[server]: Running ${nodeToExecuteData.label} (${nodeToExecuteData.id})`)

            let sessionId = undefined
            if (nodeToExecuteData.instance) sessionId = checkMemorySessionId(nodeToExecuteData.instance, chatId)

            const memoryNode = this.findMemoryLabel(nodes, edges)
            const memoryType = memoryNode?.data.label

            let chatHistory: IMessage[] | string = incomingInput.history
            if (memoryNode && !incomingInput.history && (incomingInput.chatId || incomingInput.overrideConfig?.sessionId)) {
                chatHistory = await replaceChatHistory(memoryNode, incomingInput, this.AppDataSource, databaseEntities, logger)
            }

            const nodeInstanceFilePath = this.nodesPool.componentNodes[nodeToExecuteData.name].filePath as string
            const nodeModule = await import(nodeInstanceFilePath)
            const nodeInstance = new nodeModule.nodeClass({ sessionId })

            let result = isStreamValid
                ? await nodeInstance.run(nodeToExecuteData, incomingInput.question, {
                      chatflowid,
                      chatHistory,
                      socketIO,
                      socketIOClientId: incomingInput.socketIOClientId,
                      logger,
                      appDataSource: this.AppDataSource,
                      databaseEntities,
                      analytic: chatflow.analytic,
                      chatId
                  })
                : await nodeInstance.run(nodeToExecuteData, incomingInput.question, {
                      chatflowid,
                      chatHistory,
                      logger,
                      appDataSource: this.AppDataSource,
                      databaseEntities,
                      analytic: chatflow.analytic,
                      chatId
                  })

            result = typeof result === 'string' ? { text: result } : result

            // Retrieve threadId from assistant if exists
            if (typeof result === 'object' && result.assistant) {
                sessionId = result.assistant.threadId
            }

            const userMessage: Omit<IChatMessage, 'id'> = {
                role: 'userMessage',
                content: incomingInput.question,
                chatflowid,
                chatType: isInternal ? chatType.INTERNAL : chatType.EXTERNAL,
                chatId,
                memoryType,
                sessionId,
                createdDate: userMessageDateTime
            }
            await this.addChatMessage(userMessage)

            let resultText = ''
            if (result.text) resultText = result.text
            else if (result.json) resultText = '```json\n' + JSON.stringify(result.json, null, 2)
            else resultText = JSON.stringify(result, null, 2)

            const apiMessage: Omit<IChatMessage, 'id' | 'createdDate'> = {
                role: 'apiMessage',
                content: resultText,
                chatflowid,
                chatType: isInternal ? chatType.INTERNAL : chatType.EXTERNAL,
                chatId,
                memoryType,
                sessionId
            }
            if (result?.sourceDocuments) apiMessage.sourceDocuments = JSON.stringify(result.sourceDocuments)
            if (result?.usedTools) apiMessage.usedTools = JSON.stringify(result.usedTools)
            if (result?.fileAnnotations) apiMessage.fileAnnotations = JSON.stringify(result.fileAnnotations)
            await this.addChatMessage(apiMessage)

            logger.debug(`[server]: Finished running ${nodeToExecuteData.label} (${nodeToExecuteData.id})`)

            // Only return ChatId when its Internal OR incoming input has ChatId, to avoid confusion when calling API
            if (incomingInput.chatId || isInternal) result.chatId = chatId

            return res.json(result)
        } catch (e: any) {
            logger.error('[server]: Error:', e)
            return res.status(500).send(e.message)
        }
    }

    /**
     * Method that add chat messages.
     * @param {Partial<IChatMessage>} chatMessage
     */
    async addChatMessage(chatMessage: Partial<IChatMessage>): Promise<ChatMessage> {
        const newChatMessage = new ChatMessage()
        Object.assign(newChatMessage, chatMessage)

        const chatmessage = this.AppDataSource.getRepository(ChatMessage).create(newChatMessage)
        return await this.AppDataSource.getRepository(ChatMessage).save(chatmessage)
    }

    /**
     * Method that find memory label that is connected within chatflow
     * In a chatflow, there should only be 1 memory node
     * @param {IReactFlowNode[]} nodes
     * @param {IReactFlowEdge[]} edges
     * @returns {string | undefined}
     */
    findMemoryLabel(nodes: IReactFlowNode[], edges: IReactFlowEdge[]): IReactFlowNode | undefined {
        const memoryNodes = nodes.filter((node) => node.data.category === 'Memory')
        const memoryNodeIds = memoryNodes.map((mem) => mem.data.id)

        for (const edge of edges) {
            if (memoryNodeIds.includes(edge.source)) {
                const memoryNode = nodes.find((node) => node.data.id === edge.source)
                return memoryNode
            }
        }
        return undefined
    }
}
