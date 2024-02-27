import { ICommonObject, INode, INodeData, INodeExecutionData, INodeParams, NodeType } from '../../../../src'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { returnNodeExecutionData } from '../../../../src/workflow.utils'
import { CharacterTextSplitter } from 'langchain/text_splitter'

class Pdf implements INode {
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
        this.label = 'PDF Document Loader'
        this.name = 'pdfDocumentLoader'
        this.icon = 'pdf.svg'
        this.type = 'action'
        this.category = 'Document Loaders'
        this.version = 1.0
        this.description = 'Load data from PDF files'
        this.incoming = 2
        this.outgoing = 1
        this.baseClasses = ['']
        this.actions = [
            {
                label: 'PDF File Upload',
                name: 'pdfFileUpload',
                type: 'file',
                description: 'The file to upload and upsert'
            }
        ] as INodeParams[]
        this.inputParameters = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'options',
                options: [
                    {
                        label: 'Character TextSplitter',
                        name: 'characterTextSplitter'
                    },
                    {
                        label: 'CodeTextSplitter',
                        name: 'codeTextSplitter'
                    },
                    {
                        label: 'Recursive Character TextSplitter',
                        name: 'recursiveCharTextSplitter'
                    },
                    {
                        label: 'TokenTextSplitter',
                        name: 'tokenTextSplitter'
                    },
                    {
                        label: 'MarkdownTextSplitter',
                        name: 'markdownTextSplitter'
                    }
                ],
                description: 'ChatGPT model to use.',
                default: 'gpt-3.5-turbo'
            },
            {
                label: 'Usage',
                name: 'usage',
                type: 'options',
                options: [
                    {
                        label: 'One document per page',
                        name: 'perPage'
                    },
                    {
                        label: 'One document per file',
                        name: 'perFile'
                    }
                ],
                default: 'perPage'
            },
            {
                label: 'Use Legacy Build',
                name: 'legacyBuild',
                type: 'boolean',
                optional: true,
                additionalParams: true
            }
        ] as INodeParams[]
    }

    async runWorkflow(nodeData: INodeData, options: ICommonObject): Promise<INodeExecutionData[] | null> {
        const inputParametersData = nodeData.inputParameters
        const actionsData = nodeData.actions

        if (inputParametersData === undefined) {
            throw new Error('Required data missing')
        }

        if (actionsData === undefined) {
            throw new Error('Required data missing')
        }

        const usage = inputParametersData.usage as string
        const textSplitter = inputParametersData.textSplitter as string
        const pdfFileUpload = actionsData.pdfFileUpload as string
        const legacyBuild = inputParametersData.legacyBuild as boolean

        const splitDataURI = pdfFileUpload.split(',')
        const filename = (splitDataURI.pop() || 'filename:').split(':')[1]
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64')

        const splitter = new CharacterTextSplitter({
            separator: '\n\n',
            chunkSize: 1000,
            chunkOverlap: 0
        })

        let alldocs = []
        if (usage === 'perFile') {
            const loader = new PDFLoader(new Blob([bf]), {
                splitPages: false,
                pdfjs: () =>
                    // @ts-ignore
                    legacyBuild ? import('pdfjs-dist/legacy/build/pdf.js') : import('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js')
            })
            if (textSplitter) {
                const docs = await loader.loadAndSplit(splitter)
                alldocs.push(...docs)
            } else {
                const docs = await loader.load()
                alldocs.push(...docs)
            }
        } else {
            const loader = new PDFLoader(new Blob([bf]), {
                pdfjs: () =>
                    // @ts-ignore
                    legacyBuild ? import('pdfjs-dist/legacy/build/pdf.js') : import('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js')
            })
            if (textSplitter) {
                const docs = await loader.loadAndSplit(splitter)
                alldocs.push(...docs)
            } else {
                const docs = await loader.load()
                alldocs.push(...docs)
            }
        }
        return returnNodeExecutionData(alldocs)
    }
}

module.exports = { nodeClass: Pdf }
