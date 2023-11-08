import { ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src'

class CustomCriteria implements INode {
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
        this.type = 'OutputEvaluation'
        this.name = 'customCriteriaEvaluation'
        this.description = 'Evaluate the generated output against your own custom criteria'
        this.version = 1.0
        this.icon = 'criteria-custom.png'
        this.category = 'Responsible AI'
        this.label = 'Evaluation Criteria - Custom'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Name',
                name: 'name',
                type: 'string',
                optional: false
            },
            {
                label: 'Criteria Description',
                name: 'criteriaDescription',
                type: 'string',
                optional: false,
                rows: 4
            }
        ]
    }

    // eslint-disable-next-line unused-imports/no-unused-vars
    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        return ''
    }
}

module.exports = { nodeClass: CustomCriteria }
