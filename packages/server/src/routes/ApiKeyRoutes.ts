import express, { Request, Response } from 'express'

import { DataSource } from 'typeorm'
import { ChatFlow } from '../database/entities/ChatFlow'
import { addAPIKey, deleteAPIKey, getApiKey, getAPIKeys, updateAPIKey } from '../utils/apiKey'
import { AbstractRoutes } from './AbstractRoutes'

export class ApiKeyRoutes extends AbstractRoutes {
    constructor(app: express.Application) {
        super(app)
    }

    // ----------------------------------------
    // API Keys
    // ----------------------------------------
    configureRoutes() {
        // Get api keys
        this.app.get('/api/v1/apikey', async (req: Request, res: Response) => {
            const keys = await getAPIKeys()
            return this.addChatflowsCount(this.AppDataSource, keys, res)
        })

        // Add new api key
        this.app.post('/api/v1/apikey', async (req: Request, res: Response) => {
            const keys = await addAPIKey(req.body.keyName)
            return this.addChatflowsCount(this.AppDataSource, keys, res)
        })

        // Update api key
        this.app.put('/api/v1/apikey/:id', async (req: Request, res: Response) => {
            const keys = await updateAPIKey(req.params.id, req.body.keyName)
            return this.addChatflowsCount(this.AppDataSource, keys, res)
        })

        // Delete new api key
        this.app.delete('/api/v1/apikey/:id', async (req: Request, res: Response) => {
            const keys = await deleteAPIKey(req.params.id)
            return this.addChatflowsCount(this.AppDataSource, keys, res)
        })

        // Verify api key
        this.app.get('/api/v1/verify/apikey/:apiKey', async (req: Request, res: Response) => {
            try {
                const apiKey = await getApiKey(req.params.apiKey)
                if (!apiKey) return res.status(401).send('Unauthorized')
                return res.status(200).send('OK')
            } catch (err: any) {
                return res.status(500).send(err?.message)
            }
        })
    }

    addChatflowsCount = async (AppDataSource: DataSource, keys: any, res: Response) => {
        if (keys) {
            const updatedKeys: any[] = []
            //iterate through keys and get chatflows
            for (const key of keys) {
                const chatflows = await AppDataSource.getRepository(ChatFlow)
                    .createQueryBuilder('cf')
                    .where('cf.apikeyid = :apikeyid', { apikeyid: key.id })
                    .getMany()
                const linkedChatFlows: any[] = []
                chatflows.map((cf) => {
                    linkedChatFlows.push({
                        flowName: cf.name,
                        category: cf.category,
                        updatedDate: cf.updatedDate
                    })
                })
                key.chatFlows = linkedChatFlows
                updatedKeys.push(key)
            }
            return res.json(updatedKeys)
        }
        return res.json(keys)
    }
}
