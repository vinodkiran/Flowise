// from workflow integration
import { INodeExecutionData } from './Interface'
import { CronJob } from 'cron'

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
