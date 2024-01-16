import moment from 'moment'
import { IReactFlowNode, IVariableDict } from '../Interface'
import lodash from 'lodash'
import { ICommonObject, INodeData, INodeExecutionData, IOAuth2RefreshResponse } from 'flowise-components'
import { DataSource } from 'typeorm'

export enum ShortIdConstants {
    WORKFLOW_ID_PREFIX = 'W',
    EXECUTION_ID_PREFIX = 'E'
}

const RANDOM_LENGTH = 8
const DICTIONARY_1 = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const DICTIONARY_3 = 'abcdefghijklmnopqrstuvwxyz0123456789'

/**
 * Returns a Short ID
 * Format : WDDMMMYY-[0-1A-Z]*8 , ie:  B10JAN21-2CH9PX8N
 * Where W=Entity Prefix, DD=DAY, MMM=Month, YY=Year, -=Separator (hyphen character), [0-1A-Z]*8 = random part of length 8 by default.
 *
 * @param {string | Date} prefix Identifies the Entity, 'W' for Workflow, 'E' for Execution
 * @param {Date} date The Date the ShortId was created
 * @returns {string} shortId
 */
export const shortId = (prefix: 'W' | 'E', date: string | Date): string => {
    const isValidPrefix = prefix === 'W' || prefix === 'E'
    const utcCreatedAt = new Date(date)
    if (!isValidPrefix) throw new Error('Invalid short id prefix, only possible values "W" or "E".')
    const DICTIONARY = DICTIONARY_1
    let randomPart = ''
    for (let i = 0; i < RANDOM_LENGTH; i++) {
        randomPart += getRandomCharFromDictionary(DICTIONARY)
    }
    const sanitizedDate = formatDateForShortID(utcCreatedAt)
    return `${prefix}${sanitizedDate}-${randomPart}`
}

/**
 * Format a date for use in the short id DDMMMYY with no hyphens
 * @param {Date} date
 * @returns {string} the sanitized date as string ie: 10JAN21
 */
export const formatDateForShortID = (date: Date): string => {
    const localDate = moment(date)
    return localDate.format('DDMMMYY').toUpperCase()
}

export const getRandomCharFromDictionary = (dictionary: string) => {
    const minDec = 0
    const maxDec = dictionary.length + 1
    const randDec = Math.floor(Math.random() * (maxDec - minDec) + minDec)
    return dictionary.charAt(randDec)
}

export const getRandomSubdomain = () => {
    let randomPart = ''
    for (let i = 0; i < 24; i++) {
        randomPart += getRandomCharFromDictionary(DICTIONARY_3)
    }
    return randomPart
}

/**
 * Get variable value from outputResponses.output
 * @param {string} paramValue
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {string} key
 * @param {number} loopIndex
 * @returns {string}
 */
export const getVariableValue = (paramValue: string, reactFlowNodes: IReactFlowNode[], key: string, loopIndex: number): string => {
    let returnVal = paramValue
    const variableStack = []
    const variableDict = {} as IVariableDict
    let startIdx = 0
    const endIdx = returnVal.length - 1

    while (startIdx < endIdx) {
        const substr = returnVal.substring(startIdx, startIdx + 2)

        // Store the opening double curly bracket
        if (substr === '{{') {
            variableStack.push({ substr, startIdx: startIdx + 2 })
        }

        // Found the complete variable
        if (substr === '}}' && variableStack.length > 0 && variableStack[variableStack.length - 1].substr === '{{') {
            const variableStartIdx = variableStack[variableStack.length - 1].startIdx
            const variableEndIdx = startIdx
            const variableFullPath = returnVal.substring(variableStartIdx, variableEndIdx)

            // Split by first occurence of '[' to get just nodeId
            const [variableNodeId, ...rest] = variableFullPath.split('[')
            let variablePath = 'outputResponses.output' + '[' + rest.join('[')
            if (variablePath.includes('$index')) {
                variablePath = variablePath.split('$index').join(loopIndex.toString())
            }

            const executedNode = reactFlowNodes.find((nd) => nd.id === variableNodeId)
            if (executedNode) {
                const resolvedVariablePath = getVariableValue(variablePath, reactFlowNodes, key, loopIndex)
                const variableValue = lodash.get(executedNode.data, resolvedVariablePath)
                variableDict[`{{${variableFullPath}}}`] = variableValue
                // For instance: const var1 = "some var"
                if (key === 'code' && typeof variableValue === 'string') variableDict[`{{${variableFullPath}}}`] = `"${variableValue}"`
                if (key === 'code' && typeof variableValue === 'object')
                    variableDict[`{{${variableFullPath}}}`] = `${JSON.stringify(variableValue)}`
            }
            variableStack.pop()
        }
        startIdx += 1
    }

    const variablePaths = Object.keys(variableDict)
    variablePaths.sort() // Sort by length of variable path because longer path could possibly contains nested variable
    variablePaths.forEach((path) => {
        const variableValue = variableDict[path]
        // Replace all occurence
        returnVal = returnVal.split(path).join(variableValue)
    })

    return returnVal
}

/**
 * Get minimum variable array length from outputResponses.output
 * @param {string} paramValue
 * @param {IReactFlowNode[]} reactFlowNodes
 * @returns {number}
 */
export const getVariableLength = (paramValue: string, reactFlowNodes: IReactFlowNode[]): number => {
    let minLoop = Infinity
    const variableStack = []
    let startIdx = 0
    const endIdx = paramValue.length - 1

    while (startIdx < endIdx) {
        const substr = paramValue.substring(startIdx, startIdx + 2)

        // Store the opening double curly bracket
        if (substr === '{{') {
            variableStack.push({ substr, startIdx: startIdx + 2 })
        }

        // Found the complete variable
        if (substr === '}}' && variableStack.length > 0 && variableStack[variableStack.length - 1].substr === '{{') {
            const variableStartIdx = variableStack[variableStack.length - 1].startIdx
            const variableEndIdx = startIdx
            const variableFullPath = paramValue.substring(variableStartIdx, variableEndIdx)

            if (variableFullPath.includes('$index')) {
                // Split by first occurence of '[' to get just nodeId
                const [variableNodeId, ...rest] = variableFullPath.split('[')
                const variablePath = 'outputResponses.output' + '[' + rest.join('[')
                const [variableArrayPath, ..._] = variablePath.split('[$index]')

                const executedNode = reactFlowNodes.find((nd) => nd.id === variableNodeId)
                if (executedNode) {
                    const variableValue = lodash.get(executedNode.data, variableArrayPath)
                    if (Array.isArray(variableValue)) minLoop = Math.min(minLoop, variableValue.length)
                }
            }
            variableStack.pop()
        }
        startIdx += 1
    }
    return minLoop
}

/**
 * Loop through each inputs and resolve variable if neccessary
 * @param {INodeData} reactFlowNodeData
 * @param {IReactFlowNode[]} reactFlowNodes
 * @returns {INodeData}
 */
export const resolveVariables = (reactFlowNodeData: INodeData, reactFlowNodes: IReactFlowNode[]): INodeData[] => {
    const flowNodeDataArray: INodeData[] = []
    const flowNodeData = lodash.cloneDeep(reactFlowNodeData)
    const types = ['actions', 'networks', 'inputParameters']

    const getMinForLoop = (paramsObj: ICommonObject) => {
        let minLoop = Infinity
        for (const key in paramsObj) {
            const paramValue = paramsObj[key]
            if (typeof paramValue === 'string' && paramValue.includes('$index')) {
                // node.data[$index].smtg
                minLoop = Math.min(minLoop, getVariableLength(paramValue, reactFlowNodes))
            }
            if (Array.isArray(paramValue)) {
                for (let j = 0; j < paramValue.length; j += 1) {
                    minLoop = Math.min(minLoop, getMinForLoop(paramValue[j] as ICommonObject))
                }
            }
        }
        return minLoop
    }

    const getParamValues = (paramsObj: ICommonObject, loopIndex: number) => {
        for (const key in paramsObj) {
            const paramValue = paramsObj[key]

            if (typeof paramValue === 'string') {
                const resolvedValue = getVariableValue(paramValue, reactFlowNodes, key, loopIndex)
                paramsObj[key] = resolvedValue
            }

            if (typeof paramValue === 'number') {
                const paramValueStr = paramValue.toString()
                const resolvedValue = getVariableValue(paramValueStr, reactFlowNodes, key, loopIndex)
                paramsObj[key] = resolvedValue
            }

            if (Array.isArray(paramValue)) {
                for (let j = 0; j < paramValue.length; j += 1) {
                    getParamValues(paramValue[j] as ICommonObject, loopIndex)
                }
            }
        }
    }

    let minLoop = Infinity
    for (let i = 0; i < types.length; i += 1) {
        const paramsObj = (flowNodeData as any)[types[i]]
        minLoop = Math.min(minLoop, getMinForLoop(paramsObj))
    }

    if (minLoop === Infinity) {
        for (let i = 0; i < types.length; i += 1) {
            const paramsObj = (flowNodeData as any)[types[i]]
            getParamValues(paramsObj, -1)
        }
        return [flowNodeData]
    } else {
        for (let j = 0; j < minLoop; j += 1) {
            const clonedFlowNodeData = lodash.cloneDeep(flowNodeData)
            for (let i = 0; i < types.length; i += 1) {
                const paramsObj = (clonedFlowNodeData as any)[types[i]]
                getParamValues(paramsObj, j)
            }
            flowNodeDataArray.push(clonedFlowNodeData)
        }
        return flowNodeDataArray
    }
}

/**
 * Check if oAuth2 token refreshed
 * @param {INodeExecutionData[] | null} result
 * @param {INodeData} nodeData
 * @param {DataSource} appDataSource
 */
export const checkOAuth2TokenRefreshed = (result: INodeExecutionData[] | null, nodeData: INodeData, appDataSource?: DataSource) => {
    const credentialMethod = nodeData.credentials?.credentialMethod as string
    if (credentialMethod && credentialMethod.toLowerCase().includes('oauth2')) {
        //updateCredentialAfterOAuth2TokenRefreshed(result, nodeData, appDataSource)
    }
}

