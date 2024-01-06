import express, { Request, Response } from 'express'

import { Client } from 'langchainhub'
import { parsePrompt } from '../utils/hub'
import axios from 'axios'
import { AbstractRoutes } from './AbstractRoutes'

export class PromptHubRoutes extends AbstractRoutes {
    constructor(app: express.Application) {
        super(app)
    }

    // ----------------------------------------
    // Prompt from Hub
    // ----------------------------------------
    configureRoutes() {
        this.app.post('/api/v1/load-prompt', async (req: Request, res: Response) => {
            try {
                let hub = new Client()
                const prompt = await hub.pull(req.body.promptName)
                const templates = parsePrompt(prompt)
                return res.json({ status: 'OK', prompt: req.body.promptName, templates: templates })
            } catch (e: any) {
                return res.json({ status: 'ERROR', prompt: req.body.promptName, error: e?.message })
            }
        })

        this.app.post('/api/v1/prompts-list', async (req: Request, res: Response) => {
            try {
                const tags = req.body.tags ? `tags=${req.body.tags}` : ''
                // Default to 100, TODO: add pagination and use offset & limit
                const url = `https://api.hub.langchain.com/repos/?limit=100&${tags}has_commits=true&sort_field=num_likes&sort_direction=desc&is_archived=false`
                axios.get(url).then((response) => {
                    if (response.data.repos) {
                        return res.json({ status: 'OK', repos: response.data.repos })
                    }
                })
            } catch (e: any) {
                return res.json({ status: 'ERROR', repos: [] })
            }
        })
    }
}
