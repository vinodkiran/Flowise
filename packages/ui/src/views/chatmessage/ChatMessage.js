import { useState, useRef, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import socketIOClient from 'socket.io-client'
import { cloneDeep } from 'lodash'
import rehypeMathjax from 'rehype-mathjax'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import {
    CircularProgress,
    OutlinedInput,
    Divider,
    InputAdornment,
    IconButton,
    Box,
    Chip,
    Grid,
    Card,
    Button,
    CardMedia,
    CardActions
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconSend, IconUpload } from '@tabler/icons'

// project import
import { CodeBlock } from 'ui-component/markdown/CodeBlock'
import { MemoizedReactMarkdown } from 'ui-component/markdown/MemoizedReactMarkdown'
import SourceDocDialog from 'ui-component/dialog/SourceDocDialog'
import './ChatMessage.css'

// api
import chatmessageApi from 'api/chatmessage'
import chatflowsApi from 'api/chatflows'
import predictionApi from 'api/prediction'

// Hooks
import useApi from 'hooks/useApi'

// Const
import { baseURL, maxScroll } from 'store/constant'

//file upload
import FileUploadDialog from '../upload/FileUploadDialog'

import robotPNG from 'assets/images/robot.png'
import userPNG from 'assets/images/account.png'
import { isValidURL, removeDuplicateURL } from 'utils/genericHelper'
import DeleteIcon from '@mui/icons-material/Delete'

export const ChatMessage = ({ open, chatflowid, isDialog }) => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const ps = useRef()

    const [userInput, setUserInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState([
        {
            message: 'Hi there! How can I help?',
            type: 'apiMessage'
        }
    ])
    const [socketIOClientId, setSocketIOClientId] = useState('')
    const [isChatFlowAvailableToStream, setIsChatFlowAvailableToStream] = useState(false)
    const [sourceDialogOpen, setSourceDialogOpen] = useState(false)
    const [sourceDialogProps, setSourceDialogProps] = useState({})
    const [chatId, setChatId] = useState(undefined)

    const inputRef = useRef(null)
    const getChatmessageApi = useApi(chatmessageApi.getInternalChatmessageFromChatflow)
    const getIsChatflowStreamingApi = useApi(chatflowsApi.getIsChatflowStreaming)

    const getAllowChatFlowUploads = useApi(chatflowsApi.getAllowChatflowUploads)
    const [isChatFlowAvailableForUploads, setIsChatFlowAvailableForUploads] = useState(false)

    const [isUploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [dialogPosition, setDialogPosition] = useState({ top: 0, left: 0 })
    const buttonRef = useRef(null)
    const [previews, setPreviews] = useState([])
    const handleOpenUploadDialog = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setDialogPosition({
                top: rect.top - 100 - window.scrollY, // Adjust for scrolling
                left: rect.left - window.scrollX
            })
        }
        setUploadDialogOpen(true)
    }
    const scrollToBottom = () => {
        if (ps.current) {
            ps.current.scrollTo({ top: maxScroll })
        }
    }
    const handleCloseUploadDialog = (confirm, previews) => {
        setUploadDialogOpen(false)
        if (confirm) {
            clearPreviews()
            setPreviews(previews)
        }
    }
    const handleDeletePreview = (itemToDelete) => {
        if (itemToDelete.type === 'file') {
            URL.revokeObjectURL(itemToDelete.preview) // Clean up for file
        }
        setPreviews(previews.filter((item) => item !== itemToDelete))
    }
    const previewStyle = {
        width: '64px',
        height: '64px',
        objectFit: 'cover' // This makes the image cover the area, cropping it if necessary
    }
    const messageImageStyle = {
        width: '128px',
        height: '128px',
        objectFit: 'cover' // This makes the image cover the area, cropping it if necessary
    }
    const onSourceDialogClick = (data, title) => {
        setSourceDialogProps({ data, title })
        setSourceDialogOpen(true)
    }

    const onURLClick = (data) => {
        window.open(data, '_blank')
    }

    const onChange = useCallback((e) => setUserInput(e.target.value), [setUserInput])

    const updateLastMessage = (text) => {
        setMessages((prevMessages) => {
            let allMessages = [...cloneDeep(prevMessages)]
            if (allMessages[allMessages.length - 1].type === 'userMessage') return allMessages
            allMessages[allMessages.length - 1].message += text
            return allMessages
        })
    }

    const updateLastMessageSourceDocuments = (sourceDocuments) => {
        setMessages((prevMessages) => {
            let allMessages = [...cloneDeep(prevMessages)]
            if (allMessages[allMessages.length - 1].type === 'userMessage') return allMessages
            allMessages[allMessages.length - 1].sourceDocuments = sourceDocuments
            return allMessages
        })
    }

    // Handle errors
    const handleError = (message = 'Oops! There seems to be an error. Please try again.') => {
        message = message.replace(`Unable to parse JSON response from chat agent.\n\n`, '')
        setMessages((prevMessages) => [...prevMessages, { message, type: 'apiMessage' }])
        setLoading(false)
        setUserInput('')
        setTimeout(() => {
            inputRef.current?.focus()
        }, 100)
    }

    const clearPreviews = () => {
        // Revoke the data uris to avoid memory leaks
        previews.forEach((file) => URL.revokeObjectURL(file.preview))
        setPreviews([])
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (userInput.trim() === '') {
            return
        }

        setLoading(true)
        const urls = []
        previews.map((item) => {
            urls.push({
                data: item.data,
                type: item.type
            })
        })
        clearPreviews()
        setMessages((prevMessages) => [...prevMessages, { message: userInput, type: 'userMessage', url: urls }])

        // Send user question and history to API
        try {
            const params = {
                question: userInput,
                history: messages.filter((msg) => msg.message !== 'Hi there! How can I help?'),
                chatId
            }
            if (urls) params.url = urls
            //if (files) params.files = files
            if (isChatFlowAvailableToStream) params.socketIOClientId = socketIOClientId

            const response = await predictionApi.sendMessageAndGetPrediction(chatflowid, params)

            if (response.data) {
                const data = response.data
                if (!chatId) {
                    setChatId(data.chatId)
                    localStorage.setItem(`${chatflowid}_INTERNAL`, data.chatId)
                }
                if (!isChatFlowAvailableToStream) {
                    let text = ''
                    if (data.text) text = data.text
                    else if (data.json) text = '```json\n' + JSON.stringify(data.json, null, 2)
                    else text = JSON.stringify(data, null, 2)

                    setMessages((prevMessages) => [
                        ...prevMessages,
                        { message: text, sourceDocuments: data?.sourceDocuments, usedTools: data?.usedTools, type: 'apiMessage' }
                    ])
                }

                setLoading(false)
                setUserInput('')
                setTimeout(() => {
                    inputRef.current?.focus()
                    scrollToBottom()
                }, 100)
            }
        } catch (error) {
            const errorData = error.response.data || `${error.response.status}: ${error.response.statusText}`
            handleError(errorData)
            return
        }
    }

    // Prevent blank submissions and allow for multiline input
    const handleEnter = (e) => {
        // Check if IME composition is in progress
        const isIMEComposition = e.isComposing || e.keyCode === 229
        if (e.key === 'Enter' && userInput && !isIMEComposition) {
            if (!e.shiftKey && userInput) {
                handleSubmit(e)
            }
        } else if (e.key === 'Enter') {
            e.preventDefault()
        }
    }

    // Get chatmessages successful
    useEffect(() => {
        if (getChatmessageApi.data?.length) {
            const chatId = getChatmessageApi.data[0]?.chatId
            setChatId(chatId)
            localStorage.setItem(`${chatflowid}_INTERNAL`, chatId)
            const loadedMessages = getChatmessageApi.data.map((message) => {
                const obj = {
                    message: message.content,
                    type: message.role
                }
                if (message.sourceDocuments) obj.sourceDocuments = JSON.parse(message.sourceDocuments)
                if (message.usedTools) obj.usedTools = JSON.parse(message.usedTools)
                return obj
            })
            setMessages((prevMessages) => [...prevMessages, ...loadedMessages])
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getChatmessageApi.data])

    // Get chatflow uploads capability
    useEffect(() => {
        if (getAllowChatFlowUploads.data) {
            setIsChatFlowAvailableForUploads(getAllowChatFlowUploads.data?.allowUploads ?? false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAllowChatFlowUploads.data])

    // Get chatflow streaming capability
    useEffect(() => {
        if (getIsChatflowStreamingApi.data) {
            setIsChatFlowAvailableToStream(getIsChatflowStreamingApi.data?.isStreaming ?? false)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getIsChatflowStreamingApi.data])

    // Auto scroll chat to bottom
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (isDialog && inputRef) {
            setTimeout(() => {
                inputRef.current?.focus()
            }, 100)
        }
    }, [isDialog, inputRef])

    useEffect(() => {
        let socket
        if (open && chatflowid) {
            getChatmessageApi.request(chatflowid)
            getIsChatflowStreamingApi.request(chatflowid)
            getAllowChatFlowUploads.request(chatflowid)
            scrollToBottom()

            socket = socketIOClient(baseURL)

            socket.on('connect', () => {
                setSocketIOClientId(socket.id)
            })

            socket.on('start', () => {
                setMessages((prevMessages) => [...prevMessages, { message: '', type: 'apiMessage' }])
            })

            socket.on('sourceDocuments', updateLastMessageSourceDocuments)

            socket.on('token', updateLastMessage)
        }

        return () => {
            setUserInput('')
            setLoading(false)
            setMessages([
                {
                    message: 'Hi there! How can I help?',
                    type: 'apiMessage'
                }
            ])
            if (socket) {
                socket.disconnect()
                setSocketIOClientId('')
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, chatflowid])

    return (
        <>
            <div className={isDialog ? 'cloud-dialog' : 'cloud'}>
                <div ref={ps} className='messagelist'>
                    {messages &&
                        messages.map((message, index) => {
                            return (
                                // The latest message sent by the user will be animated while waiting for a response
                                <>
                                    <Box
                                        sx={{
                                            background: message.type === 'apiMessage' ? theme.palette.asyncSelect.main : ''
                                        }}
                                        key={index}
                                        style={{ display: 'flex' }}
                                        className={
                                            message.type === 'userMessage' && loading && index === messages.length - 1
                                                ? customization.isDarkMode
                                                    ? 'usermessagewaiting-dark'
                                                    : 'usermessagewaiting-light'
                                                : message.type === 'usermessagewaiting'
                                                ? 'apimessage'
                                                : 'usermessage'
                                        }
                                    >
                                        {/* Display the correct icon depending on the message type */}
                                        {message.type === 'apiMessage' ? (
                                            <img src={robotPNG} alt='AI' width='30' height='30' className='boticon' />
                                        ) : (
                                            <img src={userPNG} alt='Me' width='30' height='30' className='usericon' />
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                            {message.usedTools && (
                                                <div style={{ display: 'block', flexDirection: 'row', width: '100%' }}>
                                                    {message.usedTools.map((tool, index) => {
                                                        return (
                                                            <Chip
                                                                size='small'
                                                                key={index}
                                                                label={tool.tool}
                                                                component='a'
                                                                sx={{ mr: 1, mt: 1 }}
                                                                variant='outlined'
                                                                clickable
                                                                onClick={() => onSourceDialogClick(tool, 'Used Tools')}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            )}
                                            <div className='markdownanswer'>
                                                {/* Messages are being rendered in Markdown format */}
                                                <MemoizedReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeMathjax, rehypeRaw]}
                                                    components={{
                                                        code({ inline, className, children, ...props }) {
                                                            const match = /language-(\w+)/.exec(className || '')
                                                            return !inline ? (
                                                                <CodeBlock
                                                                    key={Math.random()}
                                                                    chatflowid={chatflowid}
                                                                    isDialog={isDialog}
                                                                    language={(match && match[1]) || ''}
                                                                    value={String(children).replace(/\n$/, '')}
                                                                    {...props}
                                                                />
                                                            ) : (
                                                                <code className={className} {...props}>
                                                                    {children}
                                                                </code>
                                                            )
                                                        }
                                                    }}
                                                >
                                                    {message.message}
                                                </MemoizedReactMarkdown>
                                            </div>
                                            {message.url &&
                                                message.url.map((item, index) => {
                                                    return (
                                                        <Card key={index} sx={{ maxWidth: 128, margin: 5 }}>
                                                            <CardMedia
                                                                component='img'
                                                                image={item.data}
                                                                sx={{ height: 64 }}
                                                                alt={'preview'}
                                                                style={messageImageStyle}
                                                            />
                                                        </Card>
                                                    )
                                                })}
                                            {message.sourceDocuments && (
                                                <div style={{ display: 'block', flexDirection: 'row', width: '100%' }}>
                                                    {removeDuplicateURL(message).map((source, index) => {
                                                        const URL = isValidURL(source.metadata.source)
                                                        return (
                                                            <Chip
                                                                size='small'
                                                                key={index}
                                                                label={
                                                                    URL
                                                                        ? URL.pathname.substring(0, 15) === '/'
                                                                            ? URL.host
                                                                            : `${URL.pathname.substring(0, 15)}...`
                                                                        : `${source.pageContent.substring(0, 15)}...`
                                                                }
                                                                component='a'
                                                                sx={{ mr: 1, mb: 1 }}
                                                                variant='outlined'
                                                                clickable
                                                                onClick={() =>
                                                                    URL ? onURLClick(source.metadata.source) : onSourceDialogClick(source)
                                                                }
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </Box>
                                </>
                            )
                        })}
                </div>
            </div>
            <Divider />
            <div className='center'>
                {previews && previews.length > 0 && (
                    <Grid container spacing={2} style={{ marginTop: '5px' }}>
                        {previews.map((item, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Card variant='outlined' sx={{ maxWidth: 64 }}>
                                    <CardMedia
                                        component='img'
                                        image={item.preview}
                                        sx={{ height: 64 }}
                                        alt={`preview ${index}`}
                                        style={previewStyle}
                                    />
                                    <CardActions sx={{ padding: 0, margin: 0 }}>
                                        <Button
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDeletePreview(item)}
                                            size='small'
                                            variant='text'
                                        />
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
                <div style={{ width: '100%' }}>
                    <form style={{ width: '100%' }} onSubmit={handleSubmit}>
                        <OutlinedInput
                            inputRef={inputRef}
                            // eslint-disable-next-line
                            autoFocus
                            sx={{ width: '100%' }}
                            disabled={loading || !chatflowid}
                            onKeyDown={handleEnter}
                            id='userInput'
                            name='userInput'
                            placeholder={loading ? 'Waiting for response...' : 'Type your question...'}
                            value={userInput}
                            onChange={onChange}
                            multiline={true}
                            maxRows={isDialog ? 7 : 2}
                            startAdornment={
                                isChatFlowAvailableForUploads && (
                                    <InputAdornment position='start' sx={{ padding: '15px' }}>
                                        <IconButton
                                            ref={buttonRef}
                                            type='button'
                                            disabled={loading || !chatflowid}
                                            edge='start'
                                            onClick={handleOpenUploadDialog}
                                        >
                                            <IconUpload
                                                color={loading || !chatflowid ? '#9e9e9e' : customization.isDarkMode ? 'white' : '#1e88e5'}
                                            />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                            endAdornment={
                                <InputAdornment position='end' sx={{ padding: '15px' }}>
                                    <IconButton type='submit' disabled={loading || !chatflowid} edge='end'>
                                        {loading ? (
                                            <div>
                                                <CircularProgress color='inherit' size={20} />
                                            </div>
                                        ) : (
                                            // Send icon SVG in input field
                                            <IconSend
                                                color={loading || !chatflowid ? '#9e9e9e' : customization.isDarkMode ? 'white' : '#1e88e5'}
                                            />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            }
                        />
                    </form>
                </div>
            </div>
            <SourceDocDialog show={sourceDialogOpen} dialogProps={sourceDialogProps} onCancel={() => setSourceDialogOpen(false)} />
            <FileUploadDialog open={isUploadDialogOpen} onClose={handleCloseUploadDialog} position={dialogPosition} />
        </>
    )
}

ChatMessage.propTypes = {
    open: PropTypes.bool,
    chatflowid: PropTypes.string,
    isDialog: PropTypes.bool
}
