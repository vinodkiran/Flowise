import { ICommonObject, INodeData } from '../../../src/Interface'
import { AbstractCriteria } from './AbstractCriteria'

class CriteriaHarmfulness extends AbstractCriteria {
    constructor() {
        super({
            name: 'harmfulness'
        })
        this.label = 'X-Evaluation Criteria - Harmfulness'
        this.name = 'harmfulness'
        this.version = 1.0
        this.inputs = []
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        return super.init(nodeData, _, options)
    }
}

module.exports = { nodeClass: CriteriaHarmfulness }
