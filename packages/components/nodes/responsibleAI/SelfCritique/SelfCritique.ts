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
        this.label = 'Responsible AI'
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
                description: 'Detect text that could generate harmful output and prevent it from being sent to the language model',
                name: 'inputModeration',
                type: 'Moderation',
                optional: true,
                list: true
            },
            {
                label: 'Output Evaluation',
                description: 'Validate generated output against a set of predefined standards or provide your own standards',
                name: 'criteriaList',
                type: 'OutputEvaluation',
                optional: true,
                list: true
            },
            {
                label: 'Output Revisions',
                description: 'Validate generated output against a set of predefined standards or provide your own standards',
                name: 'principleList',
                type: 'OutputRevision',
                optional: true,
                list: true
            }
        ]
    }

    // eslint-disable-next-line unused-imports/no-unused-vars
    async init(nodeData: INodeData): Promise<any> {
        const moderations = nodeData.inputs?.inputModeration as Moderation[]
        const principles = nodeData.inputs?.principleList as ConstitutionalPrinciple[]
        const criteria = nodeData.inputs?.criteriaList as string[]
        return new SelfCritiqueRunner(moderations, criteria, principles)
    }
}

module.exports = { nodeClass: SelfCritique }
