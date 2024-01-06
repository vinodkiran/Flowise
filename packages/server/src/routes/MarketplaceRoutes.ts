import express, { Request, Response } from 'express'

import path from 'path'
import fs from 'fs'
import { AbstractRoutes } from './AbstractRoutes'

export class MarketplaceRoutes extends AbstractRoutes {
    constructor(app: express.Application) {
        super(app)
    }

    // ----------------------------------------
    // Marketplaces
    // ----------------------------------------
    configureRoutes() {
        // Get all chatflows for marketplaces
        this.app.get('/api/v1/marketplaces/chatflows', async (req: Request, res: Response) => {
            const marketplaceDir = path.join(__dirname, '..', '..', 'marketplaces', 'chatflows')
            const jsonsInDir = fs.readdirSync(marketplaceDir).filter((file) => path.extname(file) === '.json')
            const templates: any[] = []
            jsonsInDir.forEach((file, index) => {
                const filePath = path.join(__dirname, '..', '..', 'marketplaces', 'chatflows', file)
                const fileData = fs.readFileSync(filePath)
                const fileDataObj = JSON.parse(fileData.toString())
                const template = {
                    id: index,
                    name: file.split('.json')[0],
                    flowData: fileData.toString(),
                    badge: fileDataObj?.badge,
                    description: fileDataObj?.description || ''
                }
                templates.push(template)
            })
            const FlowiseDocsQnA = templates.find((tmp) => tmp.name === 'Flowise Docs QnA')
            const FlowiseDocsQnAIndex = templates.findIndex((tmp) => tmp.name === 'Flowise Docs QnA')
            if (FlowiseDocsQnA && FlowiseDocsQnAIndex > 0) {
                templates.splice(FlowiseDocsQnAIndex, 1)
                templates.unshift(FlowiseDocsQnA)
            }
            return res.json(templates)
        })

        // Get all tools for marketplaces
        this.app.get('/api/v1/marketplaces/tools', async (req: Request, res: Response) => {
            const marketplaceDir = path.join(__dirname, '..', '..', 'marketplaces', 'tools')
            const jsonsInDir = fs.readdirSync(marketplaceDir).filter((file) => path.extname(file) === '.json')
            const templates: any[] = []
            jsonsInDir.forEach((file, index) => {
                const filePath = path.join(__dirname, '..', '..', 'marketplaces', 'tools', file)
                const fileData = fs.readFileSync(filePath)
                const fileDataObj = JSON.parse(fileData.toString())
                const template = {
                    ...fileDataObj,
                    id: index,
                    templateName: file.split('.json')[0]
                }
                templates.push(template)
            })
            return res.json(templates)
        })
    }
}
