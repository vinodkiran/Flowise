import { Moderation } from '../ResponsibleAI'
import { ConstitutionalChain, ConstitutionalPrinciple, LLMChain } from 'langchain/chains'
import { BaseLanguageModel, BaseLanguageModelCallOptions } from 'langchain/base_language'

export class SelfCritiqueRunner {
    private moderations: Moderation[]
    private principles: ConstitutionalPrinciple[]

    constructor(moderations: Moderation[], principles: ConstitutionalPrinciple[]) {
        this.moderations = moderations
        this.principles = principles
    }

    public async checkInputs(llm: BaseLanguageModel, input: string): Promise<string> {
        for (const moderation of this.moderations) {
            input = await moderation.checkForViolations(llm, input)
        }
        return Promise.resolve(input)
    }

    public createConstitutionChain(chain: LLMChain<string, BaseLanguageModel<any, BaseLanguageModelCallOptions>>) {
        return ConstitutionalChain.fromLLM(chain.llm, {
            chain: chain,
            constitutionalPrinciples: this.principles
        })
    }
}
