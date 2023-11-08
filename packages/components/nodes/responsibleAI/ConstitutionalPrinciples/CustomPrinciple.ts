import { getBaseClasses, ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src'
import { ConstitutionalPrinciple } from 'langchain/chains'

class CustomPrinciple implements INode {
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

    protected constructor() {
        this.type = 'OutputRevision'
        this.icon = 'principles.png'
        this.category = 'Responsible AI'
        this.description = 'Filters and modifies the generated content to align with your custom principles'
        this.baseClasses = [this.type, ...getBaseClasses(ConstitutionalPrinciple)]
        this.name = 'customPrinciple'
        this.version = 1.0
        this.label = 'Output Revision - Custom'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Name',
                name: 'name',
                type: 'string',
                optional: false
            },
            {
                label: 'Critique Request',
                name: 'critiqueRequest',
                type: 'string',
                optional: false,
                rows: 4
            },
            {
                label: 'Revision Request',
                name: 'revisionRequest',
                type: 'string',
                optional: false,
                rows: 4
            }
        ]
    }

    // eslint-disable-next-line unused-imports/no-unused-vars
    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const name = nodeData.inputs?.name as string
        const critiqueRequest = nodeData.inputs?.critiqueRequest as string
        const revisionRequest = nodeData.inputs?.revisionRequest as string
        return new ConstitutionalPrinciple({ critiqueRequest, revisionRequest, name })
    }
}

module.exports = { nodeClass: CustomPrinciple }
