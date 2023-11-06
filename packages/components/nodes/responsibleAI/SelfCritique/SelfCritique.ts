import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src'
import { Moderation, ResponsibleAI } from '../ResponsibleAI'
import { ConstitutionalPrinciple } from 'langchain/chains'
import { SelfCritiqueRunner } from './SelfCritiqueRunner'

class SelfCritique implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'Self Critique'
        this.name = 'selfCritique'
        this.version = 1.0
        this.type = 'ResponsibleAI'
        this.icon = 'constitution.png'
        this.category = 'Responsible AI'
        this.description = 'Ensures the input and output of the language model adheres to a predefined set of standards'
        this.baseClasses = [this.type, ...getBaseClasses(ResponsibleAI)]
        this.inputs = [
            {
                label: 'Input Moderation',
                name: 'inputModeration',
                type: 'Moderation',
                optional: true,
                list: true
            },
            {
                label: 'Principles',
                name: 'principleList',
                type: 'ConstitutionalPrinciple',
                optional: true,
                list: true
            }
        ]
    }

    // eslint-disable-next-line unused-imports/no-unused-vars
    async init(nodeData: INodeData): Promise<any> {
        const moderations = nodeData.inputs?.inputModeration as Moderation[]
        const principles = nodeData.inputs?.principleList as ConstitutionalPrinciple[]
        return new SelfCritiqueRunner(moderations, principles)
    }
}

module.exports = { nodeClass: SelfCritique }
