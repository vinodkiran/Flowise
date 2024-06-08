import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import moment from 'moment'

// material-ui
import {
    Button,
    Box,
    Stack,
    Chip,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Skeleton
} from "@mui/material";
import TableCell, { tableCellClasses } from '@mui/material/TableCell'
import { styled, useTheme } from "@mui/material/styles";

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
import { IconTrash, IconX } from "@tabler/icons-react";
import APIEmptySVG from '@/assets/images/api_empty.svg'
import ErrorBoundary from "@/ErrorBoundary";
import ViewHeader from "@/layout/MainLayout/ViewHeader";

// ==============================|| Executions ||============================== //
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderColor: theme.palette.grey[900] + 25,

    [`&.${tableCellClasses.head}`]: {
        color: theme.palette.grey[900]
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
        height: 64
    }
}))

const StyledTableRow = styled(TableRow)(() => ({
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0
    }
}))
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

    const [error, setError] = useState(null)
    const [isLoading, setLoading] = useState(true)

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
        setLoading(true)
        getAllExecutionsApi.request()
    }, [])

    useEffect(() => {
        if (getAllExecutionsApi.data) {
            setExecutions(getAllExecutionsApi.data)
            setLoading(false)
        }
    }, [getAllExecutionsApi.data])

    return (
      <>
          <MainCard>
              {error ? (
                <ErrorBoundary error={error} />
              ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader search={false} title='Executions'>
                    </ViewHeader>
                    {!isLoading && executions.length === 0 ? (
                      <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                          <Box sx={{ p: 2, height: 'auto' }}>
                              <img
                                style={{ objectFit: 'cover', height: '20vh', width: 'auto' }}
                                src={APIEmptySVG}
                                alt='APIEmptySVG'
                              />
                          </Box>
                          <div>No Executions Yet</div>
                      </Stack>
                    ) : (
                      <TableContainer
                        sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}
                        component={Paper}
                      >
                          <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                              <TableHead
                                sx={{
                                    backgroundColor: customization.isDarkMode
                                      ? theme.palette.common.black
                                      : theme.palette.grey[100],
                                    height: 56
                                }}
                              >
                                  <TableRow>
                                      <StyledTableCell>Execution ID</StyledTableCell>
                                      <StyledTableCell>Workflow Name</StyledTableCell>
                                      <StyledTableCell>State</StyledTableCell>
                                      <StyledTableCell>Started At</StyledTableCell>
                                      <StyledTableCell>Finished At</StyledTableCell>
                                      <StyledTableCell> </StyledTableCell>
                                  </TableRow>
                              </TableHead>
                              <TableBody>
                                  {isLoading ? (
                                    <>
                                        <StyledTableRow>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                        </StyledTableRow>
                                        <StyledTableRow>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                        </StyledTableRow>
                                    </>
                                  ) : (
                                    <>
                                        {executions.map((exec, index) => (
                                          <StyledTableRow key={index} hover onClick={() => open(exec)} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                              <StyledTableCell component='th' scope='row'>
                                                  <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center'
                                                    }}
                                                  >
                                                      {exec.shortId}
                                                  </div>
                                              </StyledTableCell>
                                              <StyledTableCell>{exec.workflow?.name}</StyledTableCell>
                                              <StyledTableCell>
                                                  <Chip
                                                    sx={{
                                                        color: setChipColor(exec.state),
                                                        backgroundColor: setChipBgColor(exec.state),
                                                        ml: 1
                                                    }}
                                                    label={exec.state}
                                                  />
                                              </StyledTableCell>
                                              <StyledTableCell>
                                                  {moment(exec.createdDate).format('MMMM Do YYYY, h:mm:ss A z')}
                                              </StyledTableCell>
                                              <StyledTableCell>
                                                  {moment(exec.stoppedDate).format('MMMM Do YYYY, h:mm:ss A z')}
                                              </StyledTableCell>
                                              <StyledTableCell>
                                                  <IconButton title='Delete' color='error' onClick={() => deleteExec(exec)}>
                                                      <IconTrash />
                                                  </IconButton>
                                              </StyledTableCell>
                                          </StyledTableRow>
                                        ))}
                                    </>
                                  )}
                              </TableBody>
                          </Table>
                      </TableContainer>
                    )}
                </Stack>
              )}
          </MainCard>
          <ExecutionDialog show={showDialog} dialogProps={dialogProps} onCancel={() => setShowDialog(false)}></ExecutionDialog>
      </>
    )
}

export default Executions
