import { ICommonObject, INode, INodeData, INodeExecutionData, INodeParams, NodeType } from '../../../src/Interface'
import { handleErrorMessage, returnNodeExecutionData } from '../../../src/workflow.utils'
import axios, { AxiosRequestConfig, Method } from 'axios'
import { getPrompts, setPrompt } from './constants'

class OpenAIChatGPT implements INode {
    label: string
    name: string
    type: NodeType
    description: string
    version: number
    icon: string
    category: string
    incoming: number
    outgoing: number
    actions?: INodeParams[]
    credentials?: INodeParams[]
    inputParameters?: INodeParams[]
    baseClasses: string[]

    constructor() {
        this.label = 'ChatGPT - OpenAI'
        this.name = 'openAIChatGPT'
        this.icon = 'openai.svg'
        this.type = 'action'
        this.category = 'AI - Natural Language Processing'
        this.version = 1.0
        this.description = 'Given a chat conversation, the model will return a chat completion response'
        this.incoming = 1
        this.outgoing = 1
        this.baseClasses = ['']
        this.credentials = [
            {
                label: 'Credential Method',
                name: 'credentialMethod',
                type: 'options',
                options: [
                    {
                        label: 'OpenAI API Key',
                        name: 'openAIApi'
                    }
                ],
                default: 'openAIApi'
            }
        ] as INodeParams[]
        this.inputParameters = [
            {
                label: 'ChatGPT Persona',
                name: 'chatGPTPersona',
                type: 'options',
                options: [...getPrompts()],
                default: 'Anything',
                description: 'The persona (prefix prompt) for ChatGPT'
            },
            ...setPrompt(),
            {
                label: 'Model',
                name: 'model',
                type: 'options',
                options: [
                    {
                        label: 'gpt-3.5-turbo',
                        name: 'gpt-3.5-turbo'
                    },
                    {
                        label: 'gpt-3.5-turbo-0301',
                        name: 'gpt-3.5-turbo-0301'
                    }
                ],
                description: 'ChatGPT model to use.',
                default: 'gpt-3.5-turbo'
            }
        ] as INodeParams[]
    }

    async runWorkflow(nodeData: INodeData): Promise<INodeExecutionData[] | null> {
        const inputParametersData = nodeData.inputParameters
        const credentials = nodeData.credentials

        if (inputParametersData === undefined) {
            throw new Error('Required data missing')
        }

        if (credentials === undefined) {
            throw new Error('Missing credential')
        }

        const returnData: ICommonObject[] = []
        const model = inputParametersData.model as string

        let responseData: any
        let url = 'https://api.openai.com/v1/chat/completions'

        const data = {} as any
        if (model) data.model = model

        const chatGPTPersona = inputParametersData.chatGPTPersona as string
        data.temperature = 0.8
        data.top_p = 1.0
        data.presence_penalty = 1.0
        data.messages = [
            {
                role: 'system',
                content: `You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible. Current date: ${
                    new Date().toISOString().split('T')[0]
                }`
            },
            { role: 'user', content: inputParametersData[`${chatGPTPersona.replace(/\s/g, '')}Prompt`] }
        ]

        try {
            const axiosConfig: AxiosRequestConfig = {
                method: 'POST' as Method,
                url,
                data,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    Authorization: `Bearer ${credentials!.apiKey}`
                }
            }
            const response = await axios(axiosConfig)
            responseData = response.data
        } catch (error) {
            throw handleErrorMessage(error)
        }

        if (Array.isArray(responseData)) {
            returnData.push(...responseData)
        } else {
            returnData.push(responseData)
        }

        return returnNodeExecutionData(returnData)
    }
}

module.exports = { nodeClass: OpenAIChatGPT }
