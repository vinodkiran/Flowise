import { getBaseClasses, ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src'
import { ConstitutionalPrinciple } from 'langchain/chains'

class BuiltinPrinciple implements INode {
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
        this.description = 'Filters and modifies the generated content to align with standard preconfigured constitutional principles'
        this.baseClasses = [this.type, ...getBaseClasses(ConstitutionalPrinciple)]
        this.name = 'builtinPrinciple'
        this.version = 1.0
        this.label = 'Output Revision - Built-In'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Standard Principles',
                name: 'standardPrinciples',
                description:
                    'Pre-implemented principles, select the categories to return. If not selected, all categories will be returned',
                type: 'multiOptions',
                options: [
                    {
                        label: 'harmful1',
                        name: 'harmful1'
                    },
                    {
                        label: 'harmful2',
                        name: 'harmful2'
                    },
                    {
                        label: 'harmful3',
                        name: 'harmful4'
                    },
                    {
                        label: 'harmful4',
                        name: 'harmful4'
                    },
                    {
                        label: 'harmful5',
                        name: 'harmful5'
                    },
                    {
                        label: 'harmful6',
                        name: 'harmful6'
                    },
                    {
                        label: 'harmful7',
                        name: 'harmful7'
                    },
                    {
                        label: 'insensitive',
                        name: 'insensitive'
                    },
                    {
                        label: 'offensive',
                        name: 'offensive'
                    },
                    {
                        label: 'age-innappropriate',
                        name: 'age-innappropriate'
                    },
                    {
                        label: 'derogatory',
                        name: 'derogatory'
                    },
                    {
                        label: 'controversial',
                        name: 'controversial'
                    },
                    {
                        label: 'illegal',
                        name: 'illegal'
                    },
                    {
                        label: 'controversial',
                        name: 'controversial'
                    },
                    {
                        label: 'thoughtful',
                        name: 'thoughtful'
                    },
                    {
                        label: 'misogynistic',
                        name: 'misogynistic'
                    },
                    {
                        label: 'criminal',
                        name: 'criminal'
                    }
                ],
                default: []
            },
            {
                label: 'Unified Objectives',
                name: 'unifiedObjectives',
                description:
                    "<a href='https://examine.dev/docs/Unified_objectives.pdf'>Unified Objectives</a>, select the categories to return. If not selected, all categories will be returned",
                type: 'multiOptions',
                options: [
                    {
                        label: 'uo-assumptions-1',
                        name: 'uo-assumptions-1'
                    },
                    {
                        label: 'uo-assumptions-2',
                        name: 'uo-assumptions-2'
                    },
                    {
                        label: 'uo-assumptions-3',
                        name: 'uo-assumptions-3'
                    },
                    {
                        label: 'uo-reasoning-1',
                        name: 'uo-reasoning-1'
                    },
                    {
                        label: 'uo-reasoning-2',
                        name: 'uo-reasoning-2'
                    },
                    {
                        label: 'uo-reasoning-3',
                        name: 'uo-reasoning-3'
                    },
                    {
                        label: 'uo-reasoning-4',
                        name: 'uo-reasoning-4'
                    },
                    {
                        label: 'uo-reasoning-5',
                        name: 'uo-reasoning-5'
                    },
                    {
                        label: 'uo-reasoning-6',
                        name: 'uo-reasoning-6'
                    },
                    {
                        label: 'uo-reasoning-7',
                        name: 'uo-reasoning-7'
                    },
                    {
                        label: 'uo-evidence-1',
                        name: 'uo-evidence-1'
                    },
                    {
                        label: 'uo-evidence-2',
                        name: 'uo-evidence-2'
                    },
                    {
                        label: 'uo-evidence-3',
                        name: 'uo-evidence-3'
                    },
                    {
                        label: 'uo-evidence-4',
                        name: 'uo-evidence-4'
                    },
                    {
                        label: 'uo-evidence-5',
                        name: 'uo-evidence-5'
                    },
                    {
                        label: 'uo-security-1',
                        name: 'uo-security-1'
                    },
                    {
                        label: 'uo-security-2',
                        name: 'uo-security-2'
                    }
                ],
                default: []
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

module.exports = { nodeClass: BuiltinPrinciple }
