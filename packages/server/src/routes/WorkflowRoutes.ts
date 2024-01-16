import express, { Request, Response } from 'express'

import { AbstractRoutes } from './AbstractRoutes'
import { WorkFlow } from '../database/entities/WorkFlow'
import { IReactFlowNode, ITestNodeBody } from '../Interface'
import { INodeData, INodeExecutionData } from 'flowise-components'
import { checkOAuth2TokenRefreshed, resolveVariables } from '../utils/workflow.utils'
import { getDataSource } from '../DataSource'
import { DataSource } from 'typeorm'
import { decryptCredentialData, getEncryptionKey } from '../utils'
import { Credential } from '../database/entities/Credential'

export class WorkflowRoutes extends AbstractRoutes {
    constructor(app: express.Application) {
        super(app)
    }

    configureRoutes() {
        // ----------------------------------------
        // Active Test Pools
        // ----------------------------------------

        // Remove active test triggers
        this.app.post('/api/v1/remove-test-triggers', async (req: Request, res: Response) => {
            // if (this.activeTestTriggerPool) await this.activeTestTriggerPool.removeAll(this.componentNodes)
            res.status(200).send('success')
            return
        })

        // Remove active test webhooks
        this.app.post('/api/v1/remove-test-webhooks', async (req: Request, res: Response) => {
            // if (this.activeTestWebhookPool) await this.activeTestWebhookPool.removeAll(this.componentNodes)
            res.status(200).send('success')
            return
        })

        // ----------------------------------------
        // Workflows
        // ----------------------------------------

        // Get all workflows
        this.app.get('/api/v1/workflows', async (req: Request, res: Response) => {
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

        // Return configured local tunnel
        this.app.get('/api/v1/get-tunnel-url', (req: Request, res: Response) => {
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

                    await decryptCredentials(nodeData)

                    if (nodeType === 'action') {
                        let results: INodeExecutionData[] = []
                        const reactFlowNodeData: INodeData[] = resolveVariables(nodeData, nodes)
                        for (let i = 0; i < reactFlowNodeData.length; i += 1) {
                            const result = await nodeInstance.runWorkflow!.call(nodeInstance, reactFlowNodeData[i])
                            checkOAuth2TokenRefreshed(result, reactFlowNodeData[i])
                            if (result) results.push(...result)
                        }
                        return res.json(results)
                        // } else if (nodeType === 'trigger') {
                        //     const triggerNodeInstance = nodeInstance as ITriggerNode
                        //     const emitEventKey = nodeId
                        //     nodeData.emitEventKey = emitEventKey
                        //     triggerNodeInstance.once(emitEventKey, async (result: INodeExecutionData[]) => {
                        //         await this.activeTestTriggerPool.remove(nodeData.name, this.nodesPool.componentNodes)
                        //         return res.json(result)
                        //     })
                        //     await triggerNodeInstance.runTrigger!.call(triggerNodeInstance, nodeData)
                        //     this.activeTestTriggerPool.add(req.params.name, nodeData)
                        // } else if (nodeType === 'webhook') {
                        //     const webhookNodeInstance = nodeInstance as IWebhookNode
                        //     const newBody = {
                        //         webhookEndpoint: nodeData.webhookEndpoint,
                        //         httpMethod: (nodeData.inputParameters?.httpMethod as WebhookMethod) || 'POST'
                        //     } as any
                        //
                        //     if (webhookNodeInstance.webhookMethods?.createWebhook) {
                        //         if (!process.env.TUNNEL_BASE_URL) {
                        //             res.status(500).send(`Please enable tunnel by setting ENABLE_TUNNEL to true in env file`)
                        //             return
                        //         }
                        //
                        //         const webhookFullUrl = `${process.env.TUNNEL_BASE_URL}api/v1/webhook/${nodeData.webhookEndpoint}`
                        //         const webhookId = await webhookNodeInstance.webhookMethods?.createWebhook.call(
                        //             webhookNodeInstance,
                        //             nodeData,
                        //             webhookFullUrl
                        //         )
                        //
                        //         if (webhookId !== undefined) {
                        //             newBody.webhookId = webhookId
                        //         }
                        //     }
                        //
                        //     this.activeTestWebhookPool.add(
                        //         newBody.webhookEndpoint,
                        //         newBody.httpMethod,
                        //         nodes,
                        //         edges,
                        //         nodeData,
                        //         nodeId,
                        //         clientId as string,
                        //         false,
                        //         newBody?.webhookId
                        //     )
                        //
                        //     return res.json(newBody)
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
    }
}

/**
 * Decrypt encrypted credentials with encryption key
 * @param {INodeData} nodeData
 */
export const decryptCredentials = async (nodeData: INodeData, appDataSource?: DataSource) => {
    if (!appDataSource) appDataSource = getDataSource()

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
