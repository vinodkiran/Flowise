import { CronJob } from 'cron'
/**
 * Types
 */

export type NodeParamsType =
    | 'asyncOptions'
    | 'options'
    | 'multiOptions'
    | 'datagrid'
    | 'string'
    | 'number'
    | 'boolean'
    | 'password'
    | 'json'
    | 'code'
    | 'date'
    | 'file'
    | 'folder'
    | 'array' //from workflow integration

export type CommonType = string | number | boolean | undefined | null

export type MessageType = 'apiMessage' | 'userMessage'

/**
 * Others
 */

export interface ICommonObject {
    [key: string]: any | CommonType | ICommonObject | CommonType[] | ICommonObject[]
}

export type IDatabaseEntity = {
    [key: string]: any
}

export interface IAttachment {
    content: string
    contentType: string
    size?: number
    filename?: string
}

// export interface INodeOptionsValue {
//     label: string
//     name: string
//     description?: string
// }

export interface INodeOptionsValue {
    label: string
    name: string
    description?: string
    parentGroup?: string
    inputParameters?: string
    exampleParameters?: string
    outputResponse?: string
    exampleResponse?: ICommonObject
    show?: INodeDisplay
    hide?: INodeDisplay
    /*
     * Only used on credentialMethod option to hide registeredCredentials
     * For example: noAuth
     */
    hideRegisteredCredential?: boolean
}

export interface INodeOutputsValue {
    label: string
    name: string
    baseClasses: string[]
    description?: string
}

export interface INodeParams {
    label: string
    name: string
    type: NodeParamsType | string
    default?: CommonType | ICommonObject | ICommonObject[]
    description?: string
    warning?: string
    options?: Array<INodeOptionsValue>
    datagrid?: Array<ICommonObject>
    credentialNames?: Array<string>
    optional?: boolean | INodeDisplay
    step?: number
    rows?: number
    list?: boolean
    acceptVariable?: boolean
    placeholder?: string
    fileType?: string
    additionalParams?: boolean
    loadMethod?: string
    hidden?: boolean
    variables?: ICommonObject[]
    //from workflow integration
    array?: Array<INodeParams>
    loadFromDbCollections?: DbCollectionName[]
    show?: INodeDisplay
    hide?: INodeDisplay
}

export interface INodeExecutionData {
    [key: string]: CommonType | CommonType[] | ICommonObject | ICommonObject[]
}

export interface INodeDisplay {
    [key: string]: string[] | string
}

export interface INodeProperties {
    label: string
    name: string
    type: string // from workflow integration - type is NodeType
    icon: string
    version: number
    category: string
    baseClasses: string[]
    description?: string
    filePath?: string
    badge?: string
    incoming?: number // workflow integration - number of incoming connections
    outgoing?: number // workflow integration - number of outgoing connections
}

export interface INode extends INodeProperties {
    inputs?: INodeParams[]
    output?: INodeOutputsValue[]
    loadMethods?: {
        [key: string]: (
            nodeData: INodeData,
            options?: ICommonObject,
            dbCollection?: IDbCollection,
            apiKeys?: ICommonObject[]
        ) => Promise<INodeOptionsValue[]>
    }
    vectorStoreMethods?: {
        upsert: (nodeData: INodeData, options?: ICommonObject) => Promise<void>
        search: (nodeData: INodeData, options?: ICommonObject) => Promise<any>
        delete: (nodeData: INodeData, options?: ICommonObject) => Promise<void>
    }
    memoryMethods?: {
        clearSessionMemory: (nodeData: INodeData, options?: ICommonObject) => Promise<void>
        getChatMessages: (nodeData: INodeData, options?: ICommonObject) => Promise<string>
    }
    //from workflow integration
    actions?: INodeParams[]
    credentials?: INodeParams[]
    networks?: INodeParams[]
    inputParameters?: INodeParams[]
    webhookMethods?: {
        createWebhook: (nodeData: INodeData, webhookFullUrl: string) => Promise<string | undefined>
        deleteWebhook: (nodeData: INodeData, webhookId: string) => Promise<boolean>
    }
    runWorkflow?(nodeData: INodeData, options?: ICommonObject): Promise<INodeExecutionData[] | null>
    runTrigger?(nodeData: INodeData): Promise<void>
    removeTrigger?(nodeData: INodeData): Promise<void>
    runWebhook?(nodeData: INodeData): Promise<IWebhookNodeExecutionData[] | null>
    // end of workflow integration
    init?(nodeData: INodeData, input: string, options?: ICommonObject): Promise<any>
    run?(nodeData: INodeData, input: string, options?: ICommonObject): Promise<string | ICommonObject>
}
// from workflow integration
// export interface INode extends INodeProperties {
//     loadMethods?: {
//         [key: string]: (nodeData: INodeData, dbCollection?: IDbCollection, apiKeys?: ICommonObject[]) => Promise<INodeOptionsValue[]>
//     }
// }

export interface INodeData extends INodeProperties {
    id: string
    inputs?: ICommonObject
    outputs?: ICommonObject
    credential?: string
    instance?: any
    loadMethod?: string // method to load async options

    // from workflow integration
    emitEventKey?: string // event emitter key for triggers

    actions?: ICommonObject
    credentials?: ICommonObject
    networks?: ICommonObject
    inputParameters?: ICommonObject
    outputResponses?: ICommonObject

    loadFromDbCollections?: DbCollectionName[] // method to load async options

    req?: Request // For webhook
    webhookEndpoint?: string // For webhook
    // end of workflow integration
}

export interface INodeCredential {
    label: string
    name: string
    description?: string
    inputs?: INodeParams[]
    // from workflow integration
    // version: number
    // credentials: INodeParams[]
    // end of workflow integration
}

export interface IMessage {
    message: string
    type: MessageType
}

export interface IUsedTool {
    tool: string
    toolInput: object
    toolOutput: string | object
}

/**
 * Classes
 */

import { PromptTemplate as LangchainPromptTemplate, PromptTemplateInput } from 'langchain/prompts'
import { VectorStore } from 'langchain/vectorstores/base'

export class PromptTemplate extends LangchainPromptTemplate {
    promptValues: ICommonObject

    constructor(input: PromptTemplateInput) {
        super(input)
    }
}

export interface PromptRetrieverInput {
    name: string
    description: string
    systemMessage: string
}

const fixedTemplate = `Here is a question:
{input}
`
export class PromptRetriever {
    name: string
    description: string
    systemMessage: string

    constructor(fields: PromptRetrieverInput) {
        this.name = fields.name
        this.description = fields.description
        this.systemMessage = `${fields.systemMessage}\n${fixedTemplate}`
    }
}

export interface VectorStoreRetrieverInput {
    name: string
    description: string
    vectorStore: VectorStore
}

export class VectorStoreRetriever {
    name: string
    description: string
    vectorStore: VectorStore

    constructor(fields: VectorStoreRetrieverInput) {
        this.name = fields.name
        this.description = fields.description
        this.vectorStore = fields.vectorStore
    }
}

/**
 * Implement abstract classes and interface for memory
 */
import { BaseMessage } from 'langchain/schema'
import { BufferMemory, BufferWindowMemory, ConversationSummaryMemory } from 'langchain/memory'

export interface MemoryMethods {
    getChatMessages(overrideSessionId?: string, returnBaseMessages?: boolean): Promise<IMessage[] | BaseMessage[]>
    addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    clearChatMessages(overrideSessionId?: string): Promise<void>
    resumeMessages?(messages: IMessage[]): Promise<void>
}

export abstract class FlowiseMemory extends BufferMemory implements MemoryMethods {
    abstract getChatMessages(overrideSessionId?: string, returnBaseMessages?: boolean): Promise<IMessage[] | BaseMessage[]>
    abstract addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    abstract clearChatMessages(overrideSessionId?: string): Promise<void>
    abstract resumeMessages(messages: IMessage[]): Promise<void>
}

export abstract class FlowiseWindowMemory extends BufferWindowMemory implements MemoryMethods {
    abstract getChatMessages(overrideSessionId?: string, returnBaseMessages?: boolean): Promise<IMessage[] | BaseMessage[]>
    abstract addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    abstract clearChatMessages(overrideSessionId?: string): Promise<void>
    abstract resumeMessages(messages: IMessage[]): Promise<void>
}

export abstract class FlowiseSummaryMemory extends ConversationSummaryMemory implements MemoryMethods {
    abstract getChatMessages(overrideSessionId?: string, returnBaseMessages?: boolean): Promise<IMessage[] | BaseMessage[]>
    abstract addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    abstract clearChatMessages(overrideSessionId?: string): Promise<void>
    abstract resumeMessages(messages: IMessage[]): Promise<void>
}

// from workflow integration
export interface IWorkflow {
    _id: string
    shortId: string
    name: string
    flowData: string
    deployed: boolean
    updatedDate: Date
    createdDate: Date
}

export interface IExecution {
    _id: string
    shortId: string
    workflowShortId: string
    executionData: string
    state: ExecutionState
    createdDate: Date
    stoppedDate?: Date
}

/**
 * Types
 */
export type ExecutionState = 'INPROGRESS' | 'FINISHED' | 'ERROR' | 'TERMINATED' | 'TIMEOUT'
export type NodeType = 'action' | 'webhook' | 'trigger'
export type DbCollectionName = 'Contract' | 'Webhook' | 'Workflow' | 'Credential' | 'Execution' | 'Wallet'

/**
 * Others
 */
export type IDbCollection = {
    [key in DbCollectionName]: any[]
}

export interface IWebhookNodeExecutionData {
    data: INodeExecutionData
    response?: any
}

export interface ICronJobs {
    [key: string]: CronJob[]
}

export interface IProviders {
    [key: string]: {
        provider: any
        filter?: any
    }
}

export interface IOAuth2RefreshResponse {
    access_token: string
    expires_in: string
}
