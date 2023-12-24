import { createPortal } from 'react-dom'
import { useDispatch } from 'react-redux'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

// material-ui
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Box,
    Table,
    TableHead,
    TableRow,
    TableBody,
    Paper,
    TableContainer
} from '@mui/material'
import { IconBulb } from '@tabler/icons'

// Project import
import { StyledButton } from 'ui-component/button/StyledButton'

// store
import { HIDE_CANVAS_DIALOG, SHOW_CANVAS_DIALOG } from 'store/actions'
import useNotifier from 'utils/useNotifier'

// API
import TableCell, { tableCellClasses } from '@mui/material/TableCell'
import { styled } from '@mui/material/styles'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.action.hover
    }
}))

const StyledTableRow = styled(TableRow)(() => ({
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0
    }
}))
const ChatflowValidationMessageDialog = ({ show, dialogProps, onClose }) => {
    const portalElement = document.getElementById('portal')
    const dispatch = useDispatch()

    const [validationMessages, setValidationMessages] = useState({})
    useNotifier()

    useEffect(() => {
        if (dialogProps.validationMessages) {
            setValidationMessages(dialogProps.validationMessages)
        }

        return () => {}
    }, [dialogProps])

    useEffect(() => {
        if (show) dispatch({ type: SHOW_CANVAS_DIALOG })
        else dispatch({ type: HIDE_CANVAS_DIALOG })
        return () => dispatch({ type: HIDE_CANVAS_DIALOG })
    }, [show, dispatch])

    const component = show ? (
        <Dialog
            onClose={onClose}
            open={show}
            fullWidth
            maxWidth='sm'
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
        >
            <DialogTitle sx={{ fontSize: '1rem' }} id='alert-dialog-title'>
                Validation Results
            </DialogTitle>
            <DialogContent>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 10,
                        background: '#d8f3dc',
                        padding: 10
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}
                    >
                        <IconBulb size={30} color='#2d6a4f' />
                        <span style={{ color: '#2d6a4f', marginLeft: 10, fontWeight: 500 }}>
                            Starter prompts will only be shown when there is no messages on the chat
                        </span>
                    </div>
                </div>
                <Box sx={{ '& > :not(style)': { m: 1 }, pt: 2 }}>
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Component Node</TableCell>
                                    <TableCell>Input Params</TableCell>
                                    <TableCell>Anchors</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow sx={{ '& td': { border: 0 } }}>
                                    <TableCell sx={{ pb: 0, pt: 0 }}>Sample</TableCell>
                                    <TableCell sx={{ pb: 0, pt: 0 }}>Sample</TableCell>
                                    <TableCell sx={{ pb: 0, pt: 0 }}>Sample</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </DialogContent>
            <DialogActions>
                <StyledButton variant='contained' onClick={onClose}>
                    Close
                </StyledButton>
            </DialogActions>
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

ChatflowValidationMessageDialog.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onClose: PropTypes.func
}

export default ChatflowValidationMessageDialog
