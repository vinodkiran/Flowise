import { ICommonObject, INode, INodeData } from '../../../src/Interface'

import { AbstractPrinciple } from './AbstractPrinciple'
import { ConstitutionalPrinciple, PRINCIPLES } from 'langchain/chains'

class BuiltIn_Harmful2 extends AbstractPrinciple implements INode {
    constructor() {
        let principle: ConstitutionalPrinciple = PRINCIPLES.harmful2
        super({
            name: principle.name,
            critiqueRequest: principle.critiqueRequest,
            revisionRequest: principle.revisionRequest
        })
        this.label = 'Built In - Harmful 2'
        this.name = 'harmful2'
        this.version = 1.0
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        return super.init(nodeData, _, options)
    }
}

module.exports = { nodeClass: BuiltIn_Harmful2 }
