import { BaseLanguageModel } from 'langchain/base_language'

export abstract class Moderation {
    abstract checkForViolations(llm: BaseLanguageModel, input: string): Promise<string>
}
