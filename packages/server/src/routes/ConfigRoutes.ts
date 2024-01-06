import express, { Request, Response } from 'express'

import { ChatFlow } from '../database/entities/ChatFlow'
import { IReactFlowNode, IReactFlowObject } from '../Interface'
import { findAvailableConfigs } from '../utils'
import { AbstractRoutes } from './AbstractRoutes'

export class ConfigRoutes extends AbstractRoutes {
    constructor(app: express.Application) {
        super(app)
    }

    // ----------------------------------------
    // Configuration
    // ----------------------------------------
    configureRoutes() {
        this.app.get('/api/v1/flow-config/:id', async (req: Request, res: Response) => {
            const chatflow = await this.AppDataSource.getRepository(ChatFlow).findOneBy({
                id: req.params.id
            })
            if (!chatflow) return res.status(404).send(`Chatflow ${req.params.id} not found`)
            const flowData = chatflow.flowData
            const parsedFlowData: IReactFlowObject = JSON.parse(flowData)
            const nodes = parsedFlowData.nodes
            const availableConfigs = findAvailableConfigs(nodes, this.nodesPool.componentCredentials)
            return res.json(availableConfigs)
        })

        this.app.post('/api/v1/node-config', async (req: Request, res: Response) => {
            const nodes = [{ data: req.body }] as IReactFlowNode[]
            const availableConfigs = findAvailableConfigs(nodes, this.nodesPool.componentCredentials)
            return res.json(availableConfigs)
        })
    }
}
