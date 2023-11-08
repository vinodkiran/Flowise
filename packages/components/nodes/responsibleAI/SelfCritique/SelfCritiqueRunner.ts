import { Moderation } from '../ResponsibleAI'
import { ConstitutionalPrinciple, LLMChain } from 'langchain/chains'
import { BaseLanguageModel, BaseLanguageModelCallOptions } from 'langchain/base_language'

export class SelfCritiqueRunner {
    private readonly inputModeration: Moderation[]
    private readonly outputCriteria: string[]
    private readonly outputRevision: ConstitutionalPrinciple[]

    constructor(moderationList: Moderation[], criteriaList: string[], principleList: ConstitutionalPrinciple[]) {
        this.inputModeration = moderationList
        this.outputCriteria = criteriaList
        this.outputRevision = principleList
    }

    public async checkInputs(llm: BaseLanguageModel, input: string): Promise<string> {
        for (const moderation of this.inputModeration) {
            input = await moderation.checkForViolations(llm, input)
        }
        return input
    }

    public createConstitutionChain(chain: LLMChain<string, BaseLanguageModel<any, BaseLanguageModelCallOptions>>) {
        if (this.outputCriteria.length === 0) {
            return chain
        }
        return undefined
    }
}
