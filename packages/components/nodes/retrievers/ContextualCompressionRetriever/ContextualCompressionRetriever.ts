import { INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src/Interface'
import { BaseRetriever } from 'langchain/schema/retriever'
import { Embeddings } from 'langchain/embeddings/base'
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression'
import { EmbeddingsFilter } from 'langchain/retrievers/document_compressors/embeddings_filter'
import { BaseLanguageModel } from 'langchain/base_language'
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract'

class ContextualCompressionRetriever_Retrievers implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'Contextual Compression Retriever'
        this.name = 'contextualCompressionRetriever'
        this.version = 1.0
        this.type = 'ContextualCompressionRetriever'
        this.icon = 'compressionRetriever.svg'
        this.category = 'Retrievers'
        this.description =
            'Compress retrieved documents using the context of the given query, so that only the relevant information is returned'
        this.baseClasses = [this.type, 'BaseRetriever']
        this.inputs = [
            {
                label: 'Base Retriever',
                name: 'baseRetriever',
                type: 'VectorStoreRetriever'
            },
            {
                label: 'Embeddings',
                name: 'embeddings',
                type: 'Embeddings',
                description: 'Either Language model or Embeddings is required',
                optional: true
            },
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel',
                description: 'Either Language model or Embeddings is required',
                optional: true
            },
            {
                label: 'Similarity Threshold',
                name: 'similarityThreshold',
                description: 'Finds results with at least this similarity score. Used only if embeddings is provided',
                type: 'number',
                default: 0.8,
                step: 0.1,
                optional: true,
                additionalParams: true
            }
        ]
        // this.outputs = [
        //     {
        //         label: 'Compression Retriever',
        //         name: 'retriever',
        //         baseClasses: [this.type, ...getBaseClasses(BaseRetriever)]
        //     }
        // ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const baseRetriever = nodeData.inputs?.baseRetriever as BaseRetriever
        const embeddings = nodeData.inputs?.embeddings as Embeddings
        const similarityThreshold = nodeData.inputs?.similarityThreshold as string
        const model = nodeData.inputs?.model as BaseLanguageModel

        if (embeddings) {
            let similarityThresholdNumber = 0.8
            if (similarityThreshold) {
                similarityThresholdNumber = parseFloat(similarityThreshold)
            }
            const baseCompressor = new EmbeddingsFilter({
                embeddings: embeddings,
                similarityThreshold: similarityThresholdNumber
            })

            return new ContextualCompressionRetriever({
                baseCompressor,
                baseRetriever: baseRetriever
            })
        } else if (model) {
            return new ContextualCompressionRetriever({
                baseCompressor: LLMChainExtractor.fromLLM(model),
                baseRetriever: baseRetriever
            })
        }
        return {}
    }
}

module.exports = { nodeClass: ContextualCompressionRetriever_Retrievers }
