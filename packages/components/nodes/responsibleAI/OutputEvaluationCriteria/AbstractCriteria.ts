import { ICommonObject, INodeData, INodeOutputsValue, INodeParams } from '../../../src'

export abstract class AbstractCriteria {
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

    protected constructor({ name }: { name?: string }) {
        this.type = 'OutputEvaluation'
        this.icon = 'principles.png'
        this.category = 'Responsible AI'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Name',
                name: 'name',
                default: name,
                type: 'string',
                optional: false
            },
            {
                label: 'Evaluation Criteria',
                name: 'evaluationCriteria',
                type: 'string',
                optional: false,
                rows: 4
            }
        ]
    }

    // eslint-disable-next-line unused-imports/no-unused-vars
    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        return nodeData.inputs?.name ? nodeData.inputs?.name : this.name
    }
}
