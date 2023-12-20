import { CharacterTextSplitter, MarkdownTextSplitter, RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import path from 'path'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'

export class Playground {
    constructor() {}

    async splitChunks(options: any): Promise<object> {
        let splitter = null
        switch (options.splitter) {
            case 'character-splitter':
                splitter = new CharacterTextSplitter({
                    chunkSize: options.chunkSize,
                    chunkOverlap: options.chunkOverlap,
                    separator: options.separator
                })

                break
            case 'recursive-splitter':
                splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: options.chunkSize,
                    chunkOverlap: options.chunkOverlap
                })

                break
            case 'token-splitter':
                break
            case 'code-splitter':
                splitter = RecursiveCharacterTextSplitter.fromLanguage(options.codeLanguage, {
                    chunkSize: options.chunkSize,
                    chunkOverlap: options.chunkOverlap
                })
                break
            case 'html-to-markdown-splitter':
                break
            case 'markdown-splitter':
                splitter = new MarkdownTextSplitter({
                    chunkSize: options.chunkSize,
                    chunkOverlap: options.chunkOverlap
                })
                break
        }

        let alldocs = []
        const splitDataURI = options.file.split(',')
        const filenameTag = splitDataURI.pop()
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64')
        const blob = new Blob([bf])
        const filename = filenameTag.split(':')[1]
        let loader = null
        switch (path.extname(filename)) {
            case '.pdf':
                loader = new PDFLoader(blob)
                break
            case '.txt':
            default:
                loader = new TextLoader(blob)
                break
        }
        if (splitter) {
            const docs = await loader.loadAndSplit(splitter)
            alldocs.push(...docs)
        }
        let totalLength = 0
        if (alldocs.length > 0) {
            alldocs.forEach((doc, index) => {
                totalLength += doc.pageContent.length
            })
        }
        // return all docs if the user ask for more than we have
        if (alldocs.length <= options.noOfDocs) options.noOfDocs = alldocs.length
        // look at the docsCount param and return that many docs (only the pageContent)
        const returnedDocs = []
        for (let i = 0; i < options.noOfDocs; i++) {
            returnedDocs.push({
                content: alldocs[i].pageContent,
                length: alldocs[i].pageContent.length
            })
        }
        const metrics = {
            chunks: alldocs.length,
            tokens: 0,
            characters: totalLength,
            docs: returnedDocs
        }
        return metrics
    }
}
