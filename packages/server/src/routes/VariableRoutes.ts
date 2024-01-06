import express, { Request, Response } from 'express'

import { Variable } from '../database/entities/Variable'
import { AbstractRoutes } from './AbstractRoutes'

export class VariableRoutes extends AbstractRoutes {
    constructor(app: express.Application) {
        super(app)
    }

    // ----------------------------------------
    // Variables
    // ----------------------------------------
    configureRoutes() {
        this.app.get('/api/v1/variables', async (req: Request, res: Response) => {
            const variables = await this.AppDataSource.getRepository(Variable).find()
            return res.json(variables)
        })

        // Create new variable
        this.app.post('/api/v1/variables', async (req: Request, res: Response) => {
            const body = req.body
            const newVariable = new Variable()
            Object.assign(newVariable, body)
            const variable = this.AppDataSource.getRepository(Variable).create(newVariable)
            const results = await this.AppDataSource.getRepository(Variable).save(variable)
            return res.json(results)
        })

        // Update variable
        this.app.put('/api/v1/variables/:id', async (req: Request, res: Response) => {
            const variable = await this.AppDataSource.getRepository(Variable).findOneBy({
                id: req.params.id
            })

            if (!variable) return res.status(404).send(`Variable ${req.params.id} not found`)

            const body = req.body
            const updateVariable = new Variable()
            Object.assign(updateVariable, body)
            this.AppDataSource.getRepository(Variable).merge(variable, updateVariable)
            const result = await this.AppDataSource.getRepository(Variable).save(variable)

            return res.json(result)
        })

        // Delete variable via id
        this.app.delete('/api/v1/variables/:id', async (req: Request, res: Response) => {
            const results = await this.AppDataSource.getRepository(Variable).delete({ id: req.params.id })
            return res.json(results)
        })
    }
}
