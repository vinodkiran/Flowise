import { createPortal } from 'react-dom'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'

import {
    Stack,
    Dialog,
    Chip,
    DialogContent,
    IconButton,
    Box,
    List,
    Accordion,
    AccordionSummary,
    Typography,
    AccordionDetails
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import moment from 'moment'
import ReactJson from 'react-json-view'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { IconArrowsMaximize } from '@tabler/icons-react'

import { StyledButton } from '@/ui-component/button/StyledButton'
import AttachmentDialog from '@/ui-component/dialog/AttachmentDialog'
import HTMLDialog from '@/ui-component/dialog/HTMLDialog'
import ExpandDataDialog from '@/ui-component/dialog/ExpandDataDialog'
import './EditVariableDialog.css'

const ExecutionDialog = ({ show, dialogProps, onCancel }) => {
    const portalElement = document.getElementById('portal')

    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const [expanded, setExpanded] = useState(false)

    const [showHTMLDialog, setShowHTMLDialog] = useState(false)
    const [HTMLDialogProps, setHTMLDialogProps] = useState({})
    const [showAttachmentDialog, setShowAttachmentDialog] = useState(false)
    const [attachmentDialogProps, setAttachmentDialogProps] = useState({})
    const [showExpandDialog, setShowExpandDialog] = useState(false)
    const [expandDialogProps, setExpandDialogProps] = useState({})

    const handleAccordionChange = (executionShortId) => (event, isExpanded) => {
        setExpanded(isExpanded ? executionShortId : false)
    }

    const setChipColor = (execState) => {
        if (execState === 'INPROGRESS') return theme.palette.warning.dark
        if (execState === 'FINISHED') return theme.palette.success.dark
        if (execState === 'ERROR') return theme.palette.error.dark
        if (execState === 'TERMINATED' || execState === 'TIMEOUT') return theme.palette.grey['700']
        return theme.palette.primary.dark
    }

    const setChipBgColor = (execState) => {
        if (execState === 'INPROGRESS') return theme.palette.warning.light
        if (execState === 'FINISHED') return theme.palette.success.light
        if (execState === 'ERROR') return theme.palette.error.light
        if (execState === 'TERMINATED' || execState === 'TIMEOUT') return theme.palette.grey['300']
        return theme.palette.primary.light
    }

    const openAttachmentDialog = (executionData) => {
        const dialogProp = {
            title: 'Attachments',
            executionData
        }
        setAttachmentDialogProps(dialogProp)
        setShowAttachmentDialog(true)
    }

    const openHTMLDialog = (executionData) => {
        const dialogProp = {
            title: 'HTML',
            executionData
        }
        setHTMLDialogProps(dialogProp)
        setShowHTMLDialog(true)
    }

    const onExpandDialogClicked = (executionData, nodeLabel) => {
        const dialogProp = {
            title: `Execution Data: ${nodeLabel}`,
            data: executionData
        }
        setExpandDialogProps(dialogProp)
        setShowExpandDialog(true)
    }

    const component = show ? (
        <Dialog
            open={show}
            onClose={onCancel}
            fullWidth
            maxWidth='lg'
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
        >
            <DialogContent>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <div style={{ flex: 1 }}>
                        <PerfectScrollbar style={{ height: '100%', maxHeight: 'calc(100vh - 220px)', overflowX: 'hidden' }}>
                            <Box sx={{ pl: 2, pr: 2 }}>
                                <List
                                    sx={{
                                        width: '100%',
                                        py: 0,
                                        borderRadius: '10px',
                                        [theme.breakpoints.down('md')]: {
                                            maxWidth: 300
                                        },
                                        '& .MuiListItemSecondaryAction-root': {
                                            top: 22
                                        },
                                        '& .MuiDivider-root': {
                                            my: 0
                                        },
                                        '& .list-container': {
                                            pl: 7
                                        }
                                    }}
                                >
                                    <Box>
                                        <Accordion expanded={true} onChange={handleAccordionChange(dialogProps.execution.shortId)}>
                                            <AccordionSummary
                                                expandIcon={<ExpandMoreIcon />}
                                                aria-controls={`${dialogProps.execution.shortId}-content`}
                                                id={`${dialogProps.execution.shortId}-header`}
                                            >
                                                <Stack sx={{ p: 1, mr: 1 }} direction='column'>
                                                    <Stack sx={{ mb: 1, alignItems: 'center' }} direction='row'>
                                                        <Typography variant='h4'>{dialogProps.execution.shortId}</Typography>
                                                        {dialogProps.execution.state && (
                                                            <Chip
                                                                sx={{
                                                                    color: setChipColor(dialogProps.execution.state),
                                                                    backgroundColor: setChipBgColor(dialogProps.execution.state),
                                                                    ml: 1
                                                                }}
                                                                label={dialogProps.execution.state}
                                                            />
                                                        )}
                                                    </Stack>
                                                    <Stack sx={{ mb: -1, alignItems: 'center' }} direction='row'>
                                                        <Typography variant='h5'>Workflow:</Typography>
                                                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                        <Typography variant='h5'>{dialogProps.execution?.workflow?.name}</Typography>
                                                    </Stack>
                                                    <Stack sx={{ mt: 2, mb: -1, alignItems: 'center' }} direction='row'>
                                                        <Typography variant='h5'>Started At:</Typography>
                                                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                        <Typography variant='h5'>
                                                            {moment(dialogProps.execution.createdDate).format('MMMM Do YYYY, h:mm:ss A z')}
                                                        </Typography>
                                                    </Stack>
                                                    <Stack sx={{ mt: 2, mb: -2, alignItems: 'center' }} direction='row'>
                                                        <Typography variant='h5'>Finished At:</Typography>
                                                        &nbsp;&nbsp;&nbsp;&nbsp;
                                                        <Typography variant='h5'>
                                                            {moment(dialogProps.execution.stoppedDate).format('MMMM Do YYYY, h:mm:ss A z')}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </AccordionSummary>
                                            {dialogProps.execution.executionData &&
                                                JSON.parse(dialogProps.execution.executionData).map((execData, execDataIndex) => (
                                                    <AccordionDetails key={execDataIndex}>
                                                        <Box
                                                            sx={{
                                                                p: 2,
                                                                backgroundColor: theme.palette.secondary.light,
                                                                borderRadius: `15px`,
                                                                position: 'relative'
                                                            }}
                                                            key={execDataIndex}
                                                        >
                                                            <Typography sx={{ p: 1 }} variant='h5'>
                                                                {execData.nodeLabel}
                                                            </Typography>
                                                            <ReactJson
                                                                theme={customization.isDarkMode ? 'ocean' : 'rjv-default'}
                                                                style={{ padding: 10, borderRadius: 10 }}
                                                                collapsed
                                                                src={execData.data}
                                                                enableClipboard={(e) => copyToClipboard(e)}
                                                            />
                                                            <IconButton
                                                                size='small'
                                                                sx={{
                                                                    height: 25,
                                                                    width: 25,
                                                                    position: 'absolute',
                                                                    top: 5,
                                                                    right: 5
                                                                }}
                                                                title='Expand Data'
                                                                color='primary'
                                                                onClick={() => onExpandDialogClicked(execData.data, execData.nodeLabel)}
                                                            >
                                                                <IconArrowsMaximize />
                                                            </IconButton>
                                                            <div>
                                                                {execData.data.map((execObj, execObjIndex) => (
                                                                    <div key={execObjIndex}>
                                                                        {execObj.html && (
                                                                            <Typography sx={{ p: 1, mt: 2 }} variant='h5'>
                                                                                HTML
                                                                            </Typography>
                                                                        )}
                                                                        {execObj.html && (
                                                                            <div
                                                                                style={{
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    maxHeight: 400,
                                                                                    overflow: 'auto',
                                                                                    backgroundColor: theme.palette.card.main,
                                                                                    color: customization.isDarkMode ? 'white' : 'black',
                                                                                    borderRadius: 5
                                                                                }}
                                                                                dangerouslySetInnerHTML={{
                                                                                    __html: execObj.html
                                                                                }}
                                                                            />
                                                                        )}
                                                                        {execObj.html && (
                                                                            <StyledButton
                                                                                sx={{ mt: 1 }}
                                                                                size='small'
                                                                                variant='contained'
                                                                                onClick={() => openHTMLDialog(execData.data)}
                                                                            >
                                                                                View HTML
                                                                            </StyledButton>
                                                                        )}

                                                                        {execObj.attachments && (
                                                                            <Typography sx={{ p: 1, pb: 0, mt: 2 }} variant='h5'>
                                                                                Attachments
                                                                            </Typography>
                                                                        )}
                                                                        {execObj.attachments &&
                                                                            execObj.attachments.map((attachment, attchIndex) => (
                                                                                <div key={attchIndex}>
                                                                                    <Typography sx={{ p: 1 }} variant='h6'>
                                                                                        Item {execObjIndex} |{' '}
                                                                                        {attachment.filename
                                                                                            ? attachment.filename
                                                                                            : `Attachment ${attchIndex}`}
                                                                                    </Typography>
                                                                                    <embed
                                                                                        src={attachment.content}
                                                                                        width='100%'
                                                                                        height='100%'
                                                                                        style={{ borderStyle: 'solid' }}
                                                                                        type={attachment.contentType}
                                                                                    />
                                                                                    <StyledButton
                                                                                        size='small'
                                                                                        variant='contained'
                                                                                        onClick={() => openAttachmentDialog(execData.data)}
                                                                                    >
                                                                                        View Attachment
                                                                                    </StyledButton>
                                                                                </div>
                                                                            ))}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </Box>
                                                    </AccordionDetails>
                                                ))}
                                        </Accordion>
                                    </Box>
                                </List>
                            </Box>
                        </PerfectScrollbar>
                    </div>
                    <AttachmentDialog
                        show={showAttachmentDialog}
                        dialogProps={attachmentDialogProps}
                        onCancel={() => setShowAttachmentDialog(false)}
                    ></AttachmentDialog>
                    <HTMLDialog show={showHTMLDialog} dialogProps={HTMLDialogProps} onCancel={() => setShowHTMLDialog(false)}></HTMLDialog>
                    <ExpandDataDialog
                        show={showExpandDialog}
                        dialogProps={expandDialogProps}
                        onCancel={() => setShowExpandDialog(false)}
                    ></ExpandDataDialog>
                </div>
            </DialogContent>
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

ExecutionDialog.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onCancel: PropTypes.func
}

export default ExecutionDialog
