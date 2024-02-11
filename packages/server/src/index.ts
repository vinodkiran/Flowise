import express, { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import cors from 'cors'
import http from 'http'
import * as fs from 'fs'
import basicAuth from 'express-basic-auth'
import { Server } from 'socket.io'
import logger, { expressRequestLogger } from './utils/logger'
import { IChatFlow } from './Interface'
import { getNodeModulesPackagePath, getEncryptionKey } from './utils'
import { getDataSource } from './DataSource'
import { NodesPool } from './NodesPool'
import { ChatFlow } from './database/entities/ChatFlow'
import { ChatflowPool } from './ChatflowPool'
import { CachePool } from './CachePool'
import { initializeRateLimiter } from './utils/rateLimit'
import { getAPIKeys } from './utils/apiKey'
import localtunnel from 'localtunnel'
import { sanitizeMiddleware } from './utils/XSS'
import { CredentialRoutes } from './routes/CredentialRoutes'
import { PromptHubRoutes } from './routes/PromptHubRoutes'
import { ToolRoutes } from './routes/ToolRoutes'
import { AssistantRoutes } from './routes/AssistantRoutes'
import { UpsertRoutes } from './routes/UpsertRoutes'
import { VariableRoutes } from './routes/VariableRoutes'
import { MarketplaceRoutes } from './routes/MarketplaceRoutes'
import { ApiKeyRoutes } from './routes/ApiKeyRoutes'
import { PredictionRoutes } from './routes/PredictionRoutes'
import { ChatRoutes } from './routes/ChatRoutes'
import { ConfigRoutes } from './routes/ConfigRoutes'
import { ComponentRoutes } from './routes/ComponentRoutes'
import * as process from 'process'
import { WorkflowRoutes } from './routes/WorkflowRoutes'
import { getRandomSubdomain } from './utils/workflow.utils'
import { ActiveTestTriggerPool } from './workflow/ActiveTestTriggerPool'
import { ActiveTestWebhookPool } from './workflow/ActiveTestWebhookPool'
import { DataSource } from 'typeorm'
import { DeployedWorkflowPool } from './workflow/DeployedWorkflowPool'

export class App {
    app: express.Application
    protected _nodesPool: NodesPool
    chatflowPool: ChatflowPool
    cachePool: CachePool
    AppDataSource: DataSource
    activeTestTriggerPool: ActiveTestTriggerPool
    activeTestWebhookPool: ActiveTestWebhookPool
    deployedWorkflowsPool: DeployedWorkflowPool

    constructor() {
        this.app = express()
    }

    get nodesPool(): NodesPool {
        return this._nodesPool
    }

    async initDatabase() {
        this.AppDataSource = await getDataSource()
        // Initialize database
        this.AppDataSource.initialize()
            .then(async () => {
                logger.info('📦 [server]: Data Source has been initialized!')

                // Run Migrations Scripts
                await this.AppDataSource.runMigrations({ transaction: 'each' })

                // Initialize nodes pool
                this._nodesPool = new NodesPool()
                await this._nodesPool.initialize()

                // Initialize chatflow pool
                this.chatflowPool = new ChatflowPool()

                // Initialize API keys
                await getAPIKeys()

                // Initialize encryption key
                await getEncryptionKey()

                // Initialize Rate Limit
                const AllChatFlow: IChatFlow[] = await getAllChatFlow()
                await initializeRateLimiter(AllChatFlow)

                // Initialize cache pool
                this.cachePool = new CachePool()

                // Initialize activeTestTriggerPool instance
                this.activeTestTriggerPool = new ActiveTestTriggerPool()

                // Initialize activeTestWebhookPool instance
                this.activeTestWebhookPool = new ActiveTestWebhookPool()

                // Initialize deployed worklows instances
                this.deployedWorkflowsPool = new DeployedWorkflowPool()
                await this.deployedWorkflowsPool.initialize(this.AppDataSource, this.nodesPool.componentNodes)

                // Initialize localtunnel
                if (process.env.ENABLE_TUNNEL === 'true') {
                    const subdomain = getRandomSubdomain()

                    const tunnelSettings: localtunnel.TunnelConfig = {
                        subdomain
                    }

                    const port = parseInt(process.env.PORT || '', 10) || 3000

                    const createTunnel = (timeout: number): Promise<localtunnel.Tunnel | string> => {
                        return new Promise(function (resolve, reject) {
                            localtunnel(port, tunnelSettings).then(resolve, reject)
                            setTimeout(resolve, timeout, 'TUNNEL_TIMED_OUT')
                        })
                    }

                    const newTunnel = await createTunnel(10000)

                    if (typeof newTunnel !== 'string') {
                        process.env.TUNNEL_BASE_URL = `${newTunnel.url}/`
                        console.info('🌐[server]: TUNNEL_BASE_URL = ', process.env.TUNNEL_BASE_URL)
                    }
                }
            })
            .catch((err) => {
                logger.error('❌ [server]: Error during Data Source initialization:', err)
            })
    }

    async config(socketIO?: Server) {
        // Limit is needed to allow sending/receiving base64 encoded string
        this.app.use(express.json({ limit: '50mb' }))
        this.app.use(express.urlencoded({ limit: '50mb', extended: true }))

        if (process.env.NUMBER_OF_PROXIES && parseInt(process.env.NUMBER_OF_PROXIES) > 0)
            this.app.set('trust proxy', parseInt(process.env.NUMBER_OF_PROXIES))

        // Allow access from *
        this.app.use(cors())

        // Switch off the default 'X-Powered-By: Express' header
        this.app.disable('x-powered-by')

        // Add the expressRequestLogger middleware to log all requests
        this.app.use(expressRequestLogger)

        // Add the sanitizeMiddleware to guard against XSS
        this.app.use(sanitizeMiddleware)

        if (process.env.FLOWISE_USERNAME && process.env.FLOWISE_PASSWORD) {
            const username = process.env.FLOWISE_USERNAME
            const password = process.env.FLOWISE_PASSWORD
            const basicAuthMiddleware = basicAuth({
                users: { [username]: password }
            })
            const whitelistURLs = [
                '/api/v1/verify/apikey/',
                '/api/v1/chatflows/apikey/',
                '/api/v1/public-chatflows',
                '/api/v1/public-chatbotConfig',
                '/api/v1/prediction/',
                '/api/v1/vector/upsert/',
                '/api/v1/node-icon/',
                '/api/v1/components-credentials-icon/',
                '/api/v1/chatflows-streaming',
                '/api/v1/openai-assistants-file',
                '/api/v1/ip'
            ]
            this.app.use((req, res, next) => {
                if (req.url.includes('/api/v1/')) {
                    whitelistURLs.some((url) => req.url.includes(url)) ? next() : basicAuthMiddleware(req, res, next)
                } else next()
            })
        }

        const upload = multer({ dest: `${path.join(__dirname, '..', 'uploads')}/` })

        // ----------------------------------------
        // Configure number of proxies in Host Environment
        // ----------------------------------------
        this.app.get('/api/v1/ip', (request, response) => {
            response.send({
                ip: request.ip,
                msg: 'See the returned IP address in the response. If it matches your current IP address ( which you can get by going to http://ip.nfriedly.com/ or https://api.ipify.org/ ), then the number of proxies is correct and the rate limiter should now work correctly. If not, increase the number of proxies by 1 until the IP address matches your own. Visit https://docs.flowiseai.com/deployment#rate-limit-setup-guide for more information.'
            })
        })

        this.app.get('/api/v1/version', async (req: Request, res: Response) => {
            const getPackageJsonPath = (): string => {
                const checkPaths = [
                    path.join(__dirname, '..', 'package.json'),
                    path.join(__dirname, '..', '..', 'package.json'),
                    path.join(__dirname, '..', '..', '..', 'package.json'),
                    path.join(__dirname, '..', '..', '..', '..', 'package.json'),
                    path.join(__dirname, '..', '..', '..', '..', '..', 'package.json')
                ]
                for (const checkPath of checkPaths) {
                    if (fs.existsSync(checkPath)) {
                        return checkPath
                    }
                }
                return ''
            }

            const packagejsonPath = getPackageJsonPath()
            if (!packagejsonPath) return res.status(404).send('Version not found')
            try {
                const content = await fs.promises.readFile(packagejsonPath, 'utf8')
                const parsedContent = JSON.parse(content)
                return res.json({ version: parsedContent.version })
            } catch (error) {
                return res.status(500).send(`Version not found: ${error}`)
            }
        })

        new ConfigRoutes(this.app).configureRoutes()
        new CredentialRoutes(this.app).configureRoutes()
        new ComponentRoutes(this.app).configureRoutes()
        new AssistantRoutes(this.app).configureRoutes()
        new PromptHubRoutes(this.app).configureRoutes()
        new ToolRoutes(this.app).configureRoutes()
        new VariableRoutes(this.app).configureRoutes()
        let upsertRoutes = new UpsertRoutes(this.app)
        upsertRoutes.uploads = upload
        upsertRoutes.configureRoutes()
        new ApiKeyRoutes(this.app).configureRoutes()
        new MarketplaceRoutes(this.app).configureRoutes()
        let predictionRoutes = new PredictionRoutes(this.app)
        predictionRoutes.uploads = upload
        if (socketIO) {
            predictionRoutes.socketIO = socketIO
        }
        predictionRoutes.configureRoutes()
        new ChatRoutes(this.app).configureRoutes()
        let workflowRoutes = new WorkflowRoutes(this.app)
        workflowRoutes.configureRoutes()
        if (socketIO) {
            workflowRoutes.socketIO = socketIO
        }

        // ----------------------------------------
        // Serve UI static
        // ----------------------------------------

        const packagePath = getNodeModulesPackagePath('flowise-ui')
        const uiBuildPath = path.join(packagePath, 'build')
        const uiHtmlPath = path.join(packagePath, 'build', 'index.html')

        this.app.use('/', express.static(uiBuildPath))

        // All other requests not handled will return React app
        this.app.use((req, res) => {
            res.sendFile(uiHtmlPath)
        })
    }

    async stopApp() {
        try {
            const removePromises: any[] = []
            await Promise.all(removePromises)
        } catch (e) {
            logger.error(`❌[server]: Flowise Server shut down error: ${e}`)
        }
    }
}

let serverApp: App | undefined

export async function getAllChatFlow(): Promise<IChatFlow[]> {
    return (await getDataSource()).getRepository(ChatFlow).find()
}

export async function start(): Promise<void> {
    serverApp = new App()

    const port = parseInt(process.env.PORT || '', 10) || 3000
    const server = http.createServer(serverApp.app)

    const io = new Server(server, {
        cors: {
            origin: '*'
        }
    })

    await serverApp.initDatabase()
    await serverApp.config(io)

    server.listen(port, () => {
        logger.info(`⚡️ [server]: Flowise Server is listening at ${port}`)
    })
}

export function getInstance(): App | undefined {
    return serverApp
}
