import { OpenAI as OpenAIClient, ClientOptions } from 'openai'
import { BaseChain, ChainInputs } from 'langchain/chains'
import { ChainValues } from 'langchain/schema'
import { BasePromptTemplate } from 'langchain/prompts'

/**
 * Interface for the input parameters of the OpenAIVisionChain class.
 */
export interface OpenAIVisionChainInput extends ChainInputs {
    openAIApiKey?: string
    openAIOrganization?: string
    throwError?: boolean
    prompt?: BasePromptTemplate
    configuration?: ClientOptions
    imageUrl?: string
}

/**
 * Class representing a chain for moderating text using the OpenAI
 * Moderation API. It extends the BaseChain class and implements the
 * OpenAIVisionChainInput interface.
 */
export class OpenAIVisionChain extends BaseChain implements OpenAIVisionChainInput {
    static lc_name() {
        return 'OpenAIVisionChain'
    }

    get lc_secrets(): { [key: string]: string } | undefined {
        return {
            openAIApiKey: 'OPENAI_API_KEY'
        }
    }
    prompt: BasePromptTemplate

    inputKey = 'input'
    outputKey = 'text'
    imageUrl?: string
    openAIApiKey?: string
    openAIOrganization?: string

    clientConfig: ClientOptions
    client: OpenAIClient
    throwError: boolean

    constructor(fields?: OpenAIVisionChainInput) {
        super(fields)
        this.throwError = fields?.throwError ?? false
        this.openAIApiKey = fields?.openAIApiKey
        this.imageUrl = fields?.imageUrl
        if (!this.openAIApiKey) {
            throw new Error('OpenAI API key not found')
        }

        this.openAIOrganization = fields?.openAIOrganization

        this.clientConfig = {
            ...fields?.configuration,
            apiKey: this.openAIApiKey,
            organization: this.openAIOrganization
        }

        this.client = new OpenAIClient(this.clientConfig)
    }

    async _call(values: ChainValues): Promise<ChainValues> {
        const userInput = values[this.inputKey]
        const payload = []
        payload.push({
            type: 'text',
            text: userInput
        })
        if (this.imageUrl) {
            payload.push({
                type: 'image_url',
                image_url: {
                    url: this.imageUrl
                }
            })
        }
        // 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Charminar_Hyderabad_1.jpg/725px-Charminar_Hyderabad_1.jpg'
        const visionRequest = {
            model: 'gpt-4-vision-preview',
            max_tokens: 300,
            messages: [
                {
                    role: 'user',
                    content: payload
                }
            ]
        }
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(visionRequest, null, 2))
        let response
        try {
            // @ts-ignore
            response = await this.client.chat.completions.create(visionRequest)
        } catch (error) {
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error(error as string)
            }
        }
        const output = response.choices[0]
        return {
            [this.outputKey]: output.message.content
        }
    }

    _chainType() {
        return 'vision_chain'
    }

    get inputKeys() {
        return this.prompt.inputVariables
    }

    get outputKeys(): string[] {
        return [this.outputKey]
    }
}
