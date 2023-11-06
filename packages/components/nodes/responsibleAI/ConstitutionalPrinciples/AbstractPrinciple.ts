import { getBaseClasses, ICommonObject, INodeData, INodeOutputsValue, INodeParams } from '../../../src'
import { ConstitutionalPrinciple } from 'langchain/chains'

export abstract class AbstractPrinciple {
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

    protected constructor({ critiqueRequest, revisionRequest, name }: { critiqueRequest: string; revisionRequest: string; name?: string }) {
        this.type = 'ConstitutionalPrinciple'
        this.icon = 'principles.png'
        this.category = 'Responsible AI'
        this.baseClasses = [this.type, ...getBaseClasses(ConstitutionalPrinciple)]
        this.inputs = [
            {
                label: 'Name',
                name: 'name',
                default: name,
                type: 'string',
                optional: false
            },
            {
                label: 'Critique Request',
                name: 'critiqueRequest',
                default: critiqueRequest,
                type: 'string',
                optional: false,
                rows: 4
            },
            {
                label: 'Revision Request',
                name: 'revisionRequest',
                default: revisionRequest,
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
