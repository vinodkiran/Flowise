import express, { Request, Response } from 'express'

import { Between, FindOptionsWhere, IsNull } from 'typeorm'
import { ChatFlow } from '../database/entities/ChatFlow'
import { getApiKey } from '../utils/apiKey'
import { chatType, IChatFlow, IChatMessage, IReactFlowObject } from '../Interface'
import { getAllChatFlow } from '../index'
import {
    clearAllSessionMemory,
    clearSessionMemoryFromViewMessageDialog,
    constructGraphs,
    getEndingNodes,
    isFlowValidForStream
} from '../utils'
import { ChatMessage } from '../database/entities/ChatMessage'
import { getDataSource } from '../DataSource'
import { createRateLimiter } from '../utils/rateLimit'
import { AbstractRoutes } from './AbstractRoutes'

export class ChatRoutes extends AbstractRoutes {
    constructor(app: express.Application) {
        super(app)
    }

    // ----------------------------------------
    // Chatflows
    // ----------------------------------------
    configureRoutes() {
        // Get all chatflows
        this.app.get('/api/v1/chatflows', async (_: Request, res: Response) => {
            const chatflows: IChatFlow[] = await getAllChatFlow()
            return res.json(chatflows)
        })

        // Get specific chatflow via api key
        this.app.get('/api/v1/chatflows/apikey/:apiKey', async (req: Request, res: Response) => {
            try {
                const apiKey = await getApiKey(req.params.apiKey)
                if (!apiKey) return res.status(401).send('Unauthorized')
                const chatflows = await this.AppDataSource.getRepository(ChatFlow)
                    .createQueryBuilder('cf')
                    .where('cf.apikeyid = :apikeyid', { apikeyid: apiKey.id })
                    .orWhere('cf.apikeyid IS NULL')
                    .orWhere('cf.apikeyid = ""')
                    .orderBy('cf.name', 'ASC')
                    .getMany()
                if (chatflows.length >= 1) return res.status(200).send(chatflows)
                return res.status(404).send('Chatflow not found')
            } catch (err: any) {
                return res.status(500).send(err?.message)
            }
        })

        // Get specific chatflow via id
        this.app.get('/api/v1/chatflows/:id', async (req: Request, res: Response) => {
            const chatflow = await this.AppDataSource.getRepository(ChatFlow).findOneBy({
                id: req.params.id
            })
            if (chatflow) return res.json(chatflow)
            return res.status(404).send(`Chatflow ${req.params.id} not found`)
        })

        // Get specific chatflow via id (PUBLIC endpoint, used when sharing chatbot link)
        this.app.get('/api/v1/public-chatflows/:id', async (req: Request, res: Response) => {
            const chatflow = await this.AppDataSource.getRepository(ChatFlow).findOneBy({
                id: req.params.id
            })
            if (chatflow && chatflow.isPublic) return res.json(chatflow)
            else if (chatflow && !chatflow.isPublic) return res.status(401).send(`Unauthorized`)
            return res.status(404).send(`Chatflow ${req.params.id} not found`)
        })

        // Get specific chatflow chatbotConfig via id (PUBLIC endpoint, used to retrieve config for embedded chat)
        // Safe as public endpoint as chatbotConfig doesn't contain sensitive credential
        this.app.get('/api/v1/public-chatbotConfig/:id', async (req: Request, res: Response) => {
            const chatflow = await this.AppDataSource.getRepository(ChatFlow).findOneBy({
                id: req.params.id
            })
            if (chatflow && chatflow.chatbotConfig) {
                try {
                    const parsedConfig = JSON.parse(chatflow.chatbotConfig)
                    return res.json(parsedConfig)
                } catch (e) {
                    return res.status(500).send(`Error parsing Chatbot Config for Chatflow ${req.params.id}`)
                }
            }
            return res.status(404).send(`Chatbot Config for Chatflow ${req.params.id} not found`)
        })

        // Save chatflow
        this.app.post('/api/v1/chatflows', async (req: Request, res: Response) => {
            const body = req.body
            const newChatFlow = new ChatFlow()
            Object.assign(newChatFlow, body)

            const chatflow = this.AppDataSource.getRepository(ChatFlow).create(newChatFlow)
            const results = await this.AppDataSource.getRepository(ChatFlow).save(chatflow)

            return res.json(results)
        })

        // Update chatflow
        this.app.put('/api/v1/chatflows/:id', async (req: Request, res: Response) => {
            const chatflow = await this.AppDataSource.getRepository(ChatFlow).findOneBy({
                id: req.params.id
            })

            if (!chatflow) {
                res.status(404).send(`Chatflow ${req.params.id} not found`)
                return
            }

            const body = req.body
            const updateChatFlow = new ChatFlow()
            Object.assign(updateChatFlow, body)

            updateChatFlow.id = chatflow.id
            createRateLimiter(updateChatFlow)

            this.AppDataSource.getRepository(ChatFlow).merge(chatflow, updateChatFlow)
            const result = await this.AppDataSource.getRepository(ChatFlow).save(chatflow)

            // chatFlowPool is initialized only when a flow is opened
            // if the user attempts to rename/update category without opening any flow, chatFlowPool will be undefined
            if (this.chatflowPool) {
                // Update chatflowpool inSync to false, to build Langchain again because data has been changed
                this.chatflowPool.updateInSync(chatflow.id, false)
            }

            return res.json(result)
        })

        // Delete chatflow via id
        this.app.delete('/api/v1/chatflows/:id', async (req: Request, res: Response) => {
            const results = await this.AppDataSource.getRepository(ChatFlow).delete({ id: req.params.id })
            return res.json(results)
        })

        // Check if chatflow valid for streaming
        this.app.get('/api/v1/chatflows-streaming/:id', async (req: Request, res: Response) => {
            const chatflow = await this.AppDataSource.getRepository(ChatFlow).findOneBy({
                id: req.params.id
            })
            if (!chatflow) return res.status(404).send(`Chatflow ${req.params.id} not found`)

            /*** Get Ending Node with Directed Graph  ***/
            const flowData = chatflow.flowData
            const parsedFlowData: IReactFlowObject = JSON.parse(flowData)
            const nodes = parsedFlowData.nodes
            const edges = parsedFlowData.edges
            const { graph, nodeDependencies } = constructGraphs(nodes, edges)

            const endingNodeIds = getEndingNodes(nodeDependencies, graph)
            if (!endingNodeIds.length) return res.status(500).send(`Ending nodes not found`)

            const endingNodes = nodes.filter((nd) => endingNodeIds.includes(nd.id))

            let isStreaming = false
            for (const endingNode of endingNodes) {
                const endingNodeData = endingNode.data
                if (!endingNodeData) return res.status(500).send(`Ending node ${endingNode.id} data not found`)

                if (endingNodeData && endingNodeData.category !== 'Chains' && endingNodeData.category !== 'Agents') {
                    return res.status(500).send(`Ending node must be either a Chain or Agent`)
                }

                isStreaming = isFlowValidForStream(nodes, endingNodeData)
            }

            const obj = { isStreaming }
            return res.json(obj)
        })

        // ----------------------------------------
        // ChatMessage
        // ----------------------------------------

        // Get all chatmessages from chatflowid
        this.app.get('/api/v1/chatmessage/:id', async (req: Request, res: Response) => {
            const sortOrder = req.query?.order as string | undefined
            const chatId = req.query?.chatId as string | undefined
            const memoryType = req.query?.memoryType as string | undefined
            const sessionId = req.query?.sessionId as string | undefined
            const startDate = req.query?.startDate as string | undefined
            const endDate = req.query?.endDate as string | undefined
            let chatTypeFilter = req.query?.chatType as chatType | undefined

            if (chatTypeFilter) {
                try {
                    const chatTypeFilterArray = JSON.parse(chatTypeFilter)
                    if (chatTypeFilterArray.includes(chatType.EXTERNAL) && chatTypeFilterArray.includes(chatType.INTERNAL)) {
                        chatTypeFilter = undefined
                    } else if (chatTypeFilterArray.includes(chatType.EXTERNAL)) {
                        chatTypeFilter = chatType.EXTERNAL
                    } else if (chatTypeFilterArray.includes(chatType.INTERNAL)) {
                        chatTypeFilter = chatType.INTERNAL
                    }
                } catch (e) {
                    return res.status(500).send(e)
                }
            }

            const chatmessages = await this.getChatMessage(
                req.params.id,
                chatTypeFilter,
                sortOrder,
                chatId,
                memoryType,
                sessionId,
                startDate,
                endDate
            )
            return res.json(chatmessages)
        })

        // Get internal chatmessages from chatflowid
        this.app.get('/api/v1/internal-chatmessage/:id', async (req: Request, res: Response) => {
            const chatmessages = await this.getChatMessage(req.params.id, chatType.INTERNAL)
            return res.json(chatmessages)
        })

        // Add chatmessages for chatflowid
        this.app.post('/api/v1/chatmessage/:id', async (req: Request, res: Response) => {
            const body = req.body
            const results = await this.addChatMessage(body)
            return res.json(results)
        })

        // Delete all chatmessages from chatId
        this.app.delete('/api/v1/chatmessage/:id', async (req: Request, res: Response) => {
            const chatflowid = req.params.id
            const chatflow = await this.AppDataSource.getRepository(ChatFlow).findOneBy({
                id: chatflowid
            })
            if (!chatflow) {
                res.status(404).send(`Chatflow ${chatflowid} not found`)
                return
            }
            const chatId = (req.query?.chatId as string) ?? (await getChatId(chatflowid))
            const memoryType = req.query?.memoryType as string | undefined
            const sessionId = req.query?.sessionId as string | undefined
            const chatType = req.query?.chatType as string | undefined
            const isClearFromViewMessageDialog = req.query?.isClearFromViewMessageDialog as string | undefined

            const flowData = chatflow.flowData
            const parsedFlowData: IReactFlowObject = JSON.parse(flowData)
            const nodes = parsedFlowData.nodes

            if (isClearFromViewMessageDialog) {
                await clearSessionMemoryFromViewMessageDialog(
                    nodes,
                    this.nodesPool.componentNodes,
                    chatId,
                    this.AppDataSource,
                    sessionId,
                    memoryType
                )
            } else {
                await clearAllSessionMemory(nodes, this.nodesPool.componentNodes, chatId, this.AppDataSource, sessionId)
            }

            const deleteOptions: FindOptionsWhere<ChatMessage> = { chatflowid, chatId }
            if (memoryType) deleteOptions.memoryType = memoryType
            if (sessionId) deleteOptions.sessionId = sessionId
            if (chatType) deleteOptions.chatType = chatType

            const results = await this.AppDataSource.getRepository(ChatMessage).delete(deleteOptions)
            return res.json(results)
        })
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
     * Method that get chat messages.
     * @param {string} chatflowid
     * @param {chatType} chatType
     * @param {string} sortOrder
     * @param {string} chatId
     * @param {string} memoryType
     * @param {string} sessionId
     * @param {string} startDate
     * @param {string} endDate
     */
    async getChatMessage(
        chatflowid: string,
        chatType: chatType | undefined,
        sortOrder: string = 'ASC',
        chatId?: string,
        memoryType?: string,
        sessionId?: string,
        startDate?: string,
        endDate?: string
    ): Promise<ChatMessage[]> {
        let fromDate
        if (startDate) fromDate = new Date(startDate)

        let toDate
        if (endDate) toDate = new Date(endDate)

        return await this.AppDataSource.getRepository(ChatMessage).find({
            where: {
                chatflowid,
                chatType,
                chatId,
                memoryType: memoryType ?? (chatId ? IsNull() : undefined),
                sessionId: sessionId ?? (chatId ? IsNull() : undefined),
                createdDate: toDate && fromDate ? Between(fromDate, toDate) : undefined
            },
            order: {
                createdDate: sortOrder === 'DESC' ? 'DESC' : 'ASC'
            }
        })
    }
}

/**
 * Get first chat message id
 * @param {string} chatflowid
 * @returns {string}
 */
export async function getChatId(chatflowid: string): Promise<string> {
    // first chatmessage id as the unique chat id
    let dataSource = await getDataSource()
    const firstChatMessage = await dataSource
        .getRepository(ChatMessage)
        .createQueryBuilder('cm')
        .select('cm.id')
        .where('chatflowid = :chatflowid', { chatflowid })
        .orderBy('cm.createdDate', 'ASC')
        .getOne()
    return firstChatMessage ? firstChatMessage?.id : ''
}
