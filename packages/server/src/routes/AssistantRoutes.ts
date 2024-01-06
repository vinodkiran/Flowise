import express, { Request, Response } from 'express'

import { Assistant } from '../database/entities/Assistant'
import { decryptCredentialData, getUserHome } from '../utils'
import OpenAI from 'openai'
import path from 'path'
import fs from 'fs'
import { isEqual, uniqWith } from 'lodash'
import { Credential } from '../database/entities/Credential'
import { AbstractRoutes } from './AbstractRoutes'

export class AssistantRoutes extends AbstractRoutes {
    constructor(app: express.Application) {
        super(app)
    }

    // ----------------------------------------
    // Assistant
    // ----------------------------------------
    configureRoutes() {
        // Get all assistants
        this.app.get('/api/v1/assistants', async (req: Request, res: Response) => {
            const assistants = await this.AppDataSource.getRepository(Assistant).find()
            return res.json(assistants)
        })

        // Get specific assistant
        this.app.get('/api/v1/assistants/:id', async (req: Request, res: Response) => {
            const assistant = await this.AppDataSource.getRepository(Assistant).findOneBy({
                id: req.params.id
            })
            return res.json(assistant)
        })

        // Get assistant object
        this.app.get('/api/v1/openai-assistants/:id', async (req: Request, res: Response) => {
            const credentialId = req.query.credential as string
            const credential = await this.AppDataSource.getRepository(Credential).findOneBy({
                id: credentialId
            })

            if (!credential) return res.status(404).send(`Credential ${credentialId} not found`)

            // Decrpyt credentialData
            const decryptedCredentialData = await decryptCredentialData(credential.encryptedData)
            const openAIApiKey = decryptedCredentialData['openAIApiKey']
            if (!openAIApiKey) return res.status(404).send(`OpenAI ApiKey not found`)

            const openai = new OpenAI({ apiKey: openAIApiKey })
            const retrievedAssistant = await openai.beta.assistants.retrieve(req.params.id)
            const resp = await openai.files.list()
            const existingFiles = resp.data ?? []

            if (retrievedAssistant.file_ids && retrievedAssistant.file_ids.length) {
                ;(retrievedAssistant as any).files = existingFiles.filter((file) => retrievedAssistant.file_ids.includes(file.id))
            }

            return res.json(retrievedAssistant)
        })

        // List available assistants
        this.app.get('/api/v1/openai-assistants', async (req: Request, res: Response) => {
            const credentialId = req.query.credential as string
            const credential = await this.AppDataSource.getRepository(Credential).findOneBy({
                id: credentialId
            })

            if (!credential) return res.status(404).send(`Credential ${credentialId} not found`)

            // Decrpyt credentialData
            const decryptedCredentialData = await decryptCredentialData(credential.encryptedData)
            const openAIApiKey = decryptedCredentialData['openAIApiKey']
            if (!openAIApiKey) return res.status(404).send(`OpenAI ApiKey not found`)

            const openai = new OpenAI({ apiKey: openAIApiKey })
            const retrievedAssistants = await openai.beta.assistants.list()

            return res.json(retrievedAssistants.data)
        })

        // Add assistant
        this.app.post('/api/v1/assistants', async (req: Request, res: Response) => {
            const body = req.body

            if (!body.details) return res.status(500).send(`Invalid request body`)

            const assistantDetails = JSON.parse(body.details)

            try {
                const credential = await this.AppDataSource.getRepository(Credential).findOneBy({
                    id: body.credential
                })

                if (!credential) return res.status(404).send(`Credential ${body.credential} not found`)

                // Decrpyt credentialData
                const decryptedCredentialData = await decryptCredentialData(credential.encryptedData)
                const openAIApiKey = decryptedCredentialData['openAIApiKey']
                if (!openAIApiKey) return res.status(404).send(`OpenAI ApiKey not found`)

                const openai = new OpenAI({ apiKey: openAIApiKey })

                let tools = []
                if (assistantDetails.tools) {
                    for (const tool of assistantDetails.tools ?? []) {
                        tools.push({
                            type: tool
                        })
                    }
                }

                if (assistantDetails.uploadFiles) {
                    // Base64 strings
                    let files: string[] = []
                    const fileBase64 = assistantDetails.uploadFiles
                    if (fileBase64.startsWith('[') && fileBase64.endsWith(']')) {
                        files = JSON.parse(fileBase64)
                    } else {
                        files = [fileBase64]
                    }

                    const uploadedFiles = []
                    for (const file of files) {
                        const splitDataURI = file.split(',')
                        const filename = splitDataURI.pop()?.split(':')[1] ?? ''
                        const bf = Buffer.from(splitDataURI.pop() || '', 'base64')
                        const filePath = path.join(getUserHome(), '.flowise', 'openai-assistant', filename)
                        if (!fs.existsSync(path.join(getUserHome(), '.flowise', 'openai-assistant'))) {
                            fs.mkdirSync(path.dirname(filePath), { recursive: true })
                        }
                        if (!fs.existsSync(filePath)) {
                            fs.writeFileSync(filePath, bf)
                        }

                        const createdFile = await openai.files.create({
                            file: fs.createReadStream(filePath),
                            purpose: 'assistants'
                        })
                        uploadedFiles.push(createdFile)

                        fs.unlinkSync(filePath)
                    }
                    assistantDetails.files = [...assistantDetails.files, ...uploadedFiles]
                }

                if (!assistantDetails.id) {
                    const newAssistant = await openai.beta.assistants.create({
                        name: assistantDetails.name,
                        description: assistantDetails.description,
                        instructions: assistantDetails.instructions,
                        model: assistantDetails.model,
                        tools,
                        file_ids: (assistantDetails.files ?? []).map((file: OpenAI.Files.FileObject) => file.id)
                    })
                    assistantDetails.id = newAssistant.id
                } else {
                    const retrievedAssistant = await openai.beta.assistants.retrieve(assistantDetails.id)
                    let filteredTools = uniqWith([...retrievedAssistant.tools, ...tools], isEqual)
                    filteredTools = filteredTools.filter((tool) => !(tool.type === 'function' && !(tool as any).function))

                    await openai.beta.assistants.update(assistantDetails.id, {
                        name: assistantDetails.name,
                        description: assistantDetails.description ?? '',
                        instructions: assistantDetails.instructions ?? '',
                        model: assistantDetails.model,
                        tools: filteredTools,
                        file_ids: uniqWith(
                            [
                                ...retrievedAssistant.file_ids,
                                ...(assistantDetails.files ?? []).map((file: OpenAI.Files.FileObject) => file.id)
                            ],
                            isEqual
                        )
                    })
                }

                const newAssistantDetails = {
                    ...assistantDetails
                }
                if (newAssistantDetails.uploadFiles) delete newAssistantDetails.uploadFiles

                body.details = JSON.stringify(newAssistantDetails)
            } catch (error) {
                return res.status(500).send(`Error creating new assistant: ${error}`)
            }

            const newAssistant = new Assistant()
            Object.assign(newAssistant, body)

            const assistant = this.AppDataSource.getRepository(Assistant).create(newAssistant)
            const results = await this.AppDataSource.getRepository(Assistant).save(assistant)

            return res.json(results)
        })

        // Update assistant
        this.app.put('/api/v1/assistants/:id', async (req: Request, res: Response) => {
            const assistant = await this.AppDataSource.getRepository(Assistant).findOneBy({
                id: req.params.id
            })

            if (!assistant) {
                res.status(404).send(`Assistant ${req.params.id} not found`)
                return
            }

            try {
                const openAIAssistantId = JSON.parse(assistant.details)?.id

                const body = req.body
                const assistantDetails = JSON.parse(body.details)

                const credential = await this.AppDataSource.getRepository(Credential).findOneBy({
                    id: body.credential
                })

                if (!credential) return res.status(404).send(`Credential ${body.credential} not found`)

                // Decrpyt credentialData
                const decryptedCredentialData = await decryptCredentialData(credential.encryptedData)
                const openAIApiKey = decryptedCredentialData['openAIApiKey']
                if (!openAIApiKey) return res.status(404).send(`OpenAI ApiKey not found`)

                const openai = new OpenAI({ apiKey: openAIApiKey })

                let tools = []
                if (assistantDetails.tools) {
                    for (const tool of assistantDetails.tools ?? []) {
                        tools.push({
                            type: tool
                        })
                    }
                }

                if (assistantDetails.uploadFiles) {
                    // Base64 strings
                    let files: string[] = []
                    const fileBase64 = assistantDetails.uploadFiles
                    if (fileBase64.startsWith('[') && fileBase64.endsWith(']')) {
                        files = JSON.parse(fileBase64)
                    } else {
                        files = [fileBase64]
                    }

                    const uploadedFiles = []
                    for (const file of files) {
                        const splitDataURI = file.split(',')
                        const filename = splitDataURI.pop()?.split(':')[1] ?? ''
                        const bf = Buffer.from(splitDataURI.pop() || '', 'base64')
                        const filePath = path.join(getUserHome(), '.flowise', 'openai-assistant', filename)
                        if (!fs.existsSync(path.join(getUserHome(), '.flowise', 'openai-assistant'))) {
                            fs.mkdirSync(path.dirname(filePath), { recursive: true })
                        }
                        if (!fs.existsSync(filePath)) {
                            fs.writeFileSync(filePath, bf)
                        }

                        const createdFile = await openai.files.create({
                            file: fs.createReadStream(filePath),
                            purpose: 'assistants'
                        })
                        uploadedFiles.push(createdFile)

                        fs.unlinkSync(filePath)
                    }
                    assistantDetails.files = [...assistantDetails.files, ...uploadedFiles]
                }

                const retrievedAssistant = await openai.beta.assistants.retrieve(openAIAssistantId)
                let filteredTools = uniqWith([...retrievedAssistant.tools, ...tools], isEqual)
                filteredTools = filteredTools.filter((tool) => !(tool.type === 'function' && !(tool as any).function))

                await openai.beta.assistants.update(openAIAssistantId, {
                    name: assistantDetails.name,
                    description: assistantDetails.description,
                    instructions: assistantDetails.instructions,
                    model: assistantDetails.model,
                    tools: filteredTools,
                    file_ids: uniqWith(
                        [...retrievedAssistant.file_ids, ...(assistantDetails.files ?? []).map((file: OpenAI.Files.FileObject) => file.id)],
                        isEqual
                    )
                })

                const newAssistantDetails = {
                    ...assistantDetails,
                    id: openAIAssistantId
                }
                if (newAssistantDetails.uploadFiles) delete newAssistantDetails.uploadFiles

                const updateAssistant = new Assistant()
                body.details = JSON.stringify(newAssistantDetails)
                Object.assign(updateAssistant, body)

                this.AppDataSource.getRepository(Assistant).merge(assistant, updateAssistant)
                const result = await this.AppDataSource.getRepository(Assistant).save(assistant)

                return res.json(result)
            } catch (error) {
                return res.status(500).send(`Error updating assistant: ${error}`)
            }
        })

        // Delete assistant
        this.app.delete('/api/v1/assistants/:id', async (req: Request, res: Response) => {
            const assistant = await this.AppDataSource.getRepository(Assistant).findOneBy({
                id: req.params.id
            })

            if (!assistant) {
                res.status(404).send(`Assistant ${req.params.id} not found`)
                return
            }

            try {
                const assistantDetails = JSON.parse(assistant.details)

                const credential = await this.AppDataSource.getRepository(Credential).findOneBy({
                    id: assistant.credential
                })

                if (!credential) return res.status(404).send(`Credential ${assistant.credential} not found`)

                // Decrpyt credentialData
                const decryptedCredentialData = await decryptCredentialData(credential.encryptedData)
                const openAIApiKey = decryptedCredentialData['openAIApiKey']
                if (!openAIApiKey) return res.status(404).send(`OpenAI ApiKey not found`)

                const openai = new OpenAI({ apiKey: openAIApiKey })

                const results = await this.AppDataSource.getRepository(Assistant).delete({ id: req.params.id })

                if (req.query.isDeleteBoth) await openai.beta.assistants.del(assistantDetails.id)

                return res.json(results)
            } catch (error: any) {
                if (error.status === 404 && error.type === 'invalid_request_error') return res.send('OK')
                return res.status(500).send(`Error deleting assistant: ${error}`)
            }
        })

        // Download file from assistant
        this.app.post('/api/v1/openai-assistants-file', async (req: Request, res: Response) => {
            const filePath = path.join(getUserHome(), '.flowise', 'openai-assistant', req.body.fileName)
            //raise error if file path is not absolute
            if (!path.isAbsolute(filePath)) return res.status(500).send(`Invalid file path`)
            //raise error if file path contains '..'
            if (filePath.includes('..')) return res.status(500).send(`Invalid file path`)
            //only return from the .flowise openai-assistant folder
            if (!(filePath.includes('.flowise') && filePath.includes('openai-assistant'))) return res.status(500).send(`Invalid file path`)
            res.setHeader('Content-Disposition', 'attachment; filename=' + path.basename(filePath))
            const fileStream = fs.createReadStream(filePath)
            fileStream.pipe(res)
        })
    }
}
