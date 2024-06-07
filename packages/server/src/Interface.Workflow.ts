import {
    ICommonObject,
    INode as INodeFromComponent,
    INodeCredential,
    INodeData as INodeDataFromComponent,
    INodeExecutionData,
    IWebhookNodeExecutionData
} from 'flowise-components'
import EventEmitter from 'events'
import { IComponentNodes, ICredentialDataDecrypted, INodeDirectedGraph, IReactFlowEdge, IReactFlowNode } from './Interface'

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

export interface IComponentNodesPool extends IComponentNodes {
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
