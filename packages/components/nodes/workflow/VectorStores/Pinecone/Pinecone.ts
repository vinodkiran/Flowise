import { ICommonObject, INode, INodeData, INodeExecutionData, INodeParams, NodeType } from '../../../../src'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { returnNodeExecutionData } from '../../../../src/workflow.utils'
import { CharacterTextSplitter } from 'langchain/text_splitter'

class Pinecone implements INode {
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
        this.label = 'Pinecone Vector Store'
        this.name = 'Pinecone'
        this.icon = 'pinecone.svg'
        this.type = 'action'
        this.category = 'Vector Store'
        this.version = 1.0
        this.description = 'Pinecone Vector Store'
        this.incoming = 1
        this.outgoing = 1
        this.baseClasses = ['']
        this.inputParameters = [
            {
                label: 'Documents',
                name: 'documents',
                type: 'string',
                description: 'List of Documents to Upsert.'
            }
        ] as INodeParams[]
    }

    async runWorkflow(nodeData: INodeData, options: ICommonObject): Promise<INodeExecutionData[] | null> {
        const inputParametersData = nodeData.inputParameters
        console.log('inputParametersData', inputParametersData)
        return null
    }
}

module.exports = { nodeClass: Pinecone }
