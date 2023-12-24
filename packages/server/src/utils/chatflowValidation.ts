import { ChatFlow } from '../database/entities/ChatFlow'
import { IReactFlowObject } from '../Interface'

export const validateChatFlow = (chatFlow: ChatFlow): object => {
    try {
        const flowData = chatFlow.flowData
        const parsedFlowData: IReactFlowObject = JSON.parse(flowData)
        const nodes = parsedFlowData.nodes
        const edges = parsedFlowData.edges
        const validationMessages = {}
        let counter = 0
        nodes.forEach((node) => {
            const container = {}
            const paramMessages: string[] = []
            node.data.inputParams.forEach((inputParam) => {
                if (!inputParam.optional) {
                    // eslint-disable-next-line no-prototype-builtins
                    if (!node.data.inputs?.hasOwnProperty(inputParam.name)) {
                        paramMessages.push(`${inputParam.name}`)
                        counter++
                    } else if (node.data.inputs[inputParam.name].length === 0) {
                        paramMessages.push(`${inputParam.name}`)
                        counter++
                    }
                }
            })
            // @ts-ignore
            container.missingParams = paramMessages
            const anchorMessages: string[] = []
            node.data.inputAnchors.forEach((inputAnchor) => {
                if (!inputAnchor.optional) {
                    // eslint-disable-next-line no-prototype-builtins
                    if (!node.data.inputs?.hasOwnProperty(inputAnchor.name)) {
                        anchorMessages.push(`${inputAnchor.name}`)
                        counter++
                    } else if (node.data.inputs[inputAnchor.name].length === 0) {
                        anchorMessages.push(`${inputAnchor.name}`)
                        counter++
                    }
                }
            })
            // @ts-ignore
            container.missingAnchors = anchorMessages
            // @ts-ignore
            validationMessages[node.data.label] = container
        })
        // @ts-ignore
        validationMessages['count'] = counter
        return validationMessages
    } catch (error) {
        return {
            status: 'error',
            message: JSON.stringify(error) || 'Something went wrong'
        }
    }
}
