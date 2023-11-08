import { ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src'

class BuiltinCriteria implements INode {
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
        this.icon = 'criteria-builtin.png'
        this.name = 'builtInCriteriaEvaluation'
        this.description = 'Evaluate the generated output against a set of predefined criteria'
        this.version = 1.0
        this.category = 'Responsible AI'
        this.label = 'Evaluation Criteria - Built-in'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Categories',
                name: 'categories',
                description: 'Pre-defined criteria, select the categories to return. If not selected, all categories will be returned',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Harmfulness',
                        name: 'harmfulness'
                    },
                    {
                        label: 'Maliciousness',
                        name: 'maliciousness'
                    },
                    {
                        label: 'Controversiality',
                        name: 'controversiality'
                    },
                    {
                        label: 'Criminality',
                        name: 'criminality'
                    },
                    {
                        label: 'Misogyny',
                        name: 'misogyny'
                    },
                    {
                        label: 'Insensitivity',
                        name: 'insensitivity'
                    }
                ],
                default: []
            }
        ]
    }

    // eslint-disable-next-line unused-imports/no-unused-vars
    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const category = nodeData.inputs?.categories as string
        let categories: string[] = []
        if (category) {
            try {
                categories = JSON.parse(category)
            } catch (e) {
                categories = []
            }
        }
        return nodeData.inputs?.name ? nodeData.inputs?.name : this.name
    }
}

module.exports = { nodeClass: BuiltinCriteria }
