// Purpose: Responsible AI node component.
import { BaseLanguageModel } from 'langchain/base_language'

export abstract class ResponsibleAI {}

export abstract class Moderation extends ResponsibleAI {
    abstract checkForViolations(llm: BaseLanguageModel, input: string): Promise<string>
}
