import {
    ICommonObject,
    INode as INodeFromComponent,
    INodeCredential,
    INodeData as INodeDataFromComponent,
    INodeExecutionData,
    INodeParams,
    IWebhookNodeExecutionData
} from 'flowise-components'
import EventEmitter from 'events'

export type MessageType = 'apiMessage' | 'userMessage'

export enum chatType {
    INTERNAL = 'INTERNAL',
    EXTERNAL = 'EXTERNAL'
}
/**
 * Databases
 */
export interface IChatFlow {
    id: string
    name: string
    flowData: string
    updatedDate: Date
    createdDate: Date
    deployed?: boolean
    isPublic?: boolean
    apikeyid?: string
    analytic?: string
    chatbotConfig?: string
    apiConfig?: any
}

export interface IChatMessage {
    id: string
    role: MessageType
    content: string
    chatflowid: string
    sourceDocuments?: string
    usedTools?: string
    fileAnnotations?: string
    chatType: string
    chatId: string
    memoryType?: string
    sessionId?: string
    createdDate: Date
}

export interface ITool {
    id: string
    name: string
    description: string
    color: string
    iconSrc?: string
    schema?: string
    func?: string
    updatedDate: Date
    createdDate: Date
}

export interface IAssistant {
    id: string
    details: string
    credential: string
    iconSrc?: string
    updatedDate: Date
    createdDate: Date
}

export interface IVariable {
    id: string
    name: string
    value: string
    type: string
    updatedDate: Date
    createdDate: Date
}

export interface IComponentNodes {
    [key: string]: INode
}

export interface IComponentCredentials {
    [key: string]: INode
}

export interface IVariableDict {
    [key: string]: string
}

export interface INodeDependencies {
    [key: string]: number
}

export interface INodeDirectedGraph {
    [key: string]: string[]
}

export interface INodeData extends INodeDataFromComponent {
    inputAnchors: INodeParams[]
    inputParams: INodeParams[]
    outputAnchors: INodeParams[]
}

export interface IReactFlowNode {
    id: string
    position: {
        x: number
        y: number
    }
    type: string
    data: INodeData
    positionAbsolute: {
        x: number
        y: number
    }
    z: number
    handleBounds: {
        source: any
        target: any
    }
    width: number
    height: number
    selected: boolean
    dragging: boolean
}

export interface IReactFlowEdge {
    source: string
    sourceHandle: string
    target: string
    targetHandle: string
    type: string
    id: string
    data: {
        label: string
    }
}

export interface IReactFlowObject {
    nodes: IReactFlowNode[]
    edges: IReactFlowEdge[]
    viewport: {
        x: number
        y: number
        zoom: number
    }
}

export interface IExploredNode {
    [key: string]: {
        remainingLoop: number
        lastSeenDepth: number
    }
}

export interface INodeQueue {
    nodeId: string
    depth: number
}

export interface IDepthQueue {
    [key: string]: number
}

export interface IMessage {
    message: string
    type: MessageType
}

export interface IncomingInput {
    question: string
    history: IMessage[]
    overrideConfig?: ICommonObject
    socketIOClientId?: string
    chatId?: string
    stopNodeId?: string
}

export interface IActiveChatflows {
    [key: string]: {
        startingNodes: IReactFlowNode[]
        endingNodeData?: INodeData
        inSync: boolean
        overrideConfig?: ICommonObject
    }
}

export interface IActiveCache {
    [key: string]: Map<any, any>
}

export interface IOverrideConfig {
    node: string
    nodeId: string
    label: string
    name: string
    type: string
}

export type ICredentialDataDecrypted = ICommonObject

// Plain credential object sent to server
export interface ICredentialReqBody {
    name: string
    credentialName: string
    plainDataObj: ICredentialDataDecrypted
}

// Decrypted credential object sent back to client
export interface ICredentialReturnResponse extends ICredential {
    plainDataObj: ICredentialDataDecrypted
}

// START OF WORKFLOW RELATED INTERFACES
export interface IWorkFlow {
    id: string
    shortId: string
    name: string
    flowData: string
    deployed: boolean
    updatedDate: Date
    createdDate: Date
}

export interface IExecution {
    id: string
    shortId: string
    workflowShortId: string
    executionData: string
    state: ExecutionState
    createdDate: Date
    stoppedDate?: Date
}

export interface ICredential {
    id: string
    name: string
    credentialName: string
    encryptedData: string
    updatedDate: Date
    createdDate: Date
}

export interface IWebhook {
    id: string
    workflowShortId: string
    webhookEndpoint: string
    httpMethod: WebhookMethod
    webhookId: string
    nodeId: string
    updatedDate: Date
    createdDate: Date
}

export interface IContract {
    _id: string
    name: string
    abi: string
    address: string
    network: string
    providerCredential: string
    updatedDate: Date
    createdDate: Date
}

export interface IWallet {
    _id: string
    name: string
    address: string
    network: string
    providerCredential: string
    walletCredential: string
    updatedDate: Date
    createdDate: Date
}

/**
 * Types
 */
export type ExecutionState = 'INPROGRESS' | 'FINISHED' | 'ERROR' | 'TERMINATED' | 'TIMEOUT'

export type WebhookMethod = 'GET' | 'POST'

/**
 * Others
 */
export interface IWorkflowResponse extends IWorkFlow {
    execution: IExecution[]
    executionCount: number
}

export interface IExecutionResponse extends IExecution {
    workflow?: IWorkFlow
}

export interface INode extends INodeFromComponent {
    filePath: string
}

export interface ITriggerNode extends EventEmitter, INodeFromComponent {
    filePath: string
}

export interface IWebhookNode extends INodeFromComponent {
    filePath: string
}

export interface IComponentNodesPool {
    [key: string]: INode | ITriggerNode
}

export interface IActiveTestTriggerPool {
    [key: string]: INodeDataFromComponent
}

export interface IActiveTestWebhookPool {
    [key: string]: {
        nodes: IReactFlowNode[]
        edges: IReactFlowEdge[]
        nodeData: INodeDataFromComponent
        webhookNodeId: string
        clientId: string
        isTestWorkflow: boolean
        webhookId?: string
    }
}

export interface ICredentialBody {
    name: string
    nodeCredentialName: string
    credentialData: ICredentialDataDecrypted
}

export interface ICredentialResponse {
    _id: string
    name: string
    credentialData: ICredentialDataDecrypted
    nodeCredentialName: string
    updatedDate: Date
    createdDate: Date
}

export interface IComponentCredentialsPool {
    [key: string]: INodeCredential
}

export interface IWalletResponse extends IWallet {
    balance: string
}

export interface IWorkflowExecutedData {
    nodeLabel: string
    nodeId: string
    data: INodeExecutionData[] | IWebhookNodeExecutionData[]
    status?: ExecutionState
}

export interface ITestNodeBody {
    nodeId: string
    nodes: IReactFlowNode[]
    edges: IReactFlowEdge[]
    clientId?: string
}

export interface IDeployedWorkflowsPool {
    [key: string]: {
        emitEventKey?: string
        abortController?: AbortController
        workflowExecutedData?: IWorkflowExecutedData[]
    }
}

export interface IChildProcessMessage {
    key: string
    value?: any
}

export interface IRunWorkflowMessageValue {
    startingNodeIds: string[]
    componentNodes: IComponentNodesPool
    reactFlowNodes: IReactFlowNode[]
    reactFlowEdges: IReactFlowEdge[]
    graph: INodeDirectedGraph
    workflowExecutedData: IWorkflowExecutedData[]
}

export interface IContractRequestBody {
    credentials: ICommonObject
    networks: ICommonObject
    contractInfo: ICommonObject
}

export interface IWalletRequestBody {
    name: string
    network: string
    providerCredential?: string
    privateKey?: string
}

export interface IOAuth2Response {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token: string
}

export type ITestWorkflowBody = ITestNodeBody
