import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import moment from 'moment'

// material-ui
import { Button, Box, Stack, Chip, Table, TableBody, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material'
import TableCell, { tableCellClasses } from '@mui/material/TableCell'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ExecutionDialog from '@/ui-component/dialog/ExecutionDialog'

// API
import executionsApi from '@/api/workflows.execution'

// Hooks
import useApi from '@/hooks/useApi'

// utils
import useNotifier from '@/utils/useNotifier'

// Icons
import { IconTrash, IconX } from '@tabler/icons-react'
import APIEmptySVG from '@/assets/images/api_empty.svg'

// ==============================|| Executions ||============================== //

const Executions = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const dispatch = useDispatch()
    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [showDialog, setShowDialog] = useState(false)
    const [dialogProps, setDialogProps] = useState({})
    const [executions, setExecutions] = useState([])

    const getAllExecutionsApi = useApi(executionsApi.getAllExecutions)

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

    const open = (execution) => {
        const dialogProp = {
            title: `Execution ${execution.shortId}`,
            execution
        }
        setDialogProps(dialogProp)
        setShowDialog(true)
    }

    const deleteExec = async (exec) => {
        try {
            const deleteResp = await executionsApi.deleteExecution(exec.shortId)
            if (deleteResp.data) {
                enqueueSnackbar({
                    message: `Execution ${exec.shortId} deleted`,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
                onConfirm()
            }
        } catch (error) {
            const errorData = error.response.data || `${error.response.status}: ${error.response.statusText}`
            enqueueSnackbar({
                message: `Failed to delete Execution ${exec.shortId}: ${errorData}`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
            onCancel()
        }
    }

    const onConfirm = () => {
        setShowDialog(false)
        getAllExecutionsApi.request()
    }

    useEffect(() => {
        getAllExecutionsApi.request()
    }, [])

    useEffect(() => {
        if (getAllExecutionsApi.data) {
            setExecutions(getAllExecutionsApi.data)
            console.log(getAllExecutionsApi.data)
        }
    }, [getAllExecutionsApi.data])

    return (
        <>
            <MainCard sx={{ background: customization.isDarkMode ? theme.palette.common.black : '' }}>
                <Stack flexDirection='row'>
                    <h1>Executions&nbsp;</h1>
                    <Box sx={{ flexGrow: 1 }} />
                </Stack>
                {executions.length <= 0 && (
                    <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                        <Box sx={{ p: 2, height: 'auto' }}>
                            <img style={{ objectFit: 'cover', height: '30vh', width: 'auto' }} src={APIEmptySVG} alt='APIEmptySVG' />
                        </Box>
                        <div>No Executions Yet</div>
                    </Stack>
                )}
                {executions.length > 0 && (
                    <TableContainer component={Paper}>
                        <Table
                            sx={{
                                [`& .${tableCellClasses.root}`]: {
                                    borderBottom: 'none'
                                },
                                minWidth: 650
                            }}
                            aria-label='simple table'
                        >
                            <TableHead sx={{ borderBottom: '1px solid' }}>
                                <TableRow>
                                    <TableCell>Execution ID</TableCell>
                                    <TableCell>Workflow Name</TableCell>
                                    <TableCell>State</TableCell>
                                    <TableCell>Started At</TableCell>
                                    <TableCell>Finished At</TableCell>
                                    <TableCell> </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {executions?.map((exec, index) => (
                                    <TableRow hover key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell
                                            sx={{ cursor: 'pointer', color: theme.palette.primary.main, fontWeight: 600 }}
                                            onClick={() => open(exec)}
                                            component='th'
                                            scope='row'
                                        >
                                            {exec.shortId}
                                        </TableCell>
                                        <TableCell>{exec.name}</TableCell>
                                        <TableCell>
                                            <Chip
                                                sx={{
                                                    color: setChipColor(exec.state),
                                                    backgroundColor: setChipBgColor(exec.state),
                                                    ml: 1
                                                }}
                                                label={exec.state}
                                            />
                                        </TableCell>
                                        <TableCell>{moment(exec.createdDate).format('MMMM Do YYYY, h:mm:ss A z')}</TableCell>
                                        <TableCell>{moment(exec.stoppedDate).format('MMMM Do YYYY, h:mm:ss A z')}</TableCell>
                                        <TableCell>
                                            <IconButton title='Delete' color='error' onClick={() => deleteExec(exec)}>
                                                <IconTrash />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </MainCard>
            <ExecutionDialog show={showDialog} dialogProps={dialogProps} onCancel={() => setShowDialog(false)}></ExecutionDialog>
        </>
    )
}

export default Executions
