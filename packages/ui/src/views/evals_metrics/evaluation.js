import { useEffect, useState } from 'react'

// material-ui
import { Box, Button, ButtonGroup, IconButton, Paper, Table, TableBody, TableContainer, TableHead, TableRow, Toolbar } from '@mui/material'

// API
import evaluationApi from 'api/evaluation'

// const
import TableCell from '@mui/material/TableCell'
import MainCard from '../../ui-component/cards/MainCard'
import { useTheme } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import { IconPlus, IconRefresh, IconTrash, IconTable } from '@tabler/icons'
import { StyledButton } from '../../ui-component/button/StyledButton'
import CreateEvaluationDialog from './CreateEvaluationDialog'
import { BackdropLoader } from 'ui-component/loading/BackdropLoader'
import useApi from '../../hooks/useApi'
import moment from 'moment/moment'
import { useNavigate } from 'react-router-dom'

const EvalsEvaluation = () => {
    const navigate = useNavigate()

    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const createNewEvaluation = useApi(evaluationApi.createEvaluation)
    const getAllEvaluations = useApi(evaluationApi.getAllEvaluations)
    const deleteEvaluation = useApi(evaluationApi.deleteEvaluation)
    const [showNewEvaluationDialog, setShowNewEvaluationDialog] = useState(false)
    const [dialogProps, setDialogProps] = useState({})
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getAllEvaluations.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllEvaluations.data) {
            const rows = getAllEvaluations.data
            if (rows) {
                for (let i = 0; i < rows.length; i++) {
                    rows[i].runDate = moment(rows[i].runDate).format('DD-MMM-YY HH:MM:SS')
                    rows[i].average_metrics = JSON.parse(rows[i].average_metrics)
                }
                setRows(rows)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAllEvaluations.data])

    useEffect(() => {
        if (createNewEvaluation.data) {
            const rows = createNewEvaluation.data
            for (let i = 0; i < rows.length; i++) {
                rows[i].runDate = moment(rows[i].runDate).format('DD-MMM-YY HH:MM:SS')
                rows[i].average_metrics = JSON.parse(rows[i].average_metrics)
            }
            setRows(rows)
        }
        //console.log(saveEvaluationData)
        setLoading(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [createNewEvaluation.data])

    const onConfirm = (evaluationData) => {
        setShowNewEvaluationDialog(false)
        setLoading(true)
        createNewEvaluation.request(evaluationData)
    }

    const onRefresh = () => {
        getAllEvaluations.request()
    }

    const goToRows = (item) => {
        navigate(`/evaluation_rows/${item.id}`)
    }

    const createEvaluation = () => {
        const dialogProp = {
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Start New Evaluation',
            data: {}
        }
        setDialogProps(dialogProp)
        setShowNewEvaluationDialog(true)
    }

    const showMetrics = (metrics) => {
        if (!metrics) {
            return ''
        }
        let displayMetrics = ''
        const metricsObj = JSON.parse(metrics)
        Object.getOwnPropertyNames(metricsObj).forEach((key) => {
            displayMetrics += "<Chip variant='outlined' color='primary' label=" + metricsObj[key] + '/> '
        })
        return displayMetrics
    }

    return (
        <div>
            <MainCard sx={{ background: customization.isDarkMode ? theme.palette.common.black : '' }}>
                <>
                    <Box sx={{ flexGrow: 1 }}>
                        <Toolbar
                            disableGutters={true}
                            style={{
                                margin: 1,
                                padding: 1,
                                paddingBottom: 2,
                                display: 'flex',
                                justifyContent: 'space-between',
                                width: '100%'
                            }}
                        >
                            <h1 style={{ marginRight: '18px' }}>Evaluation</h1>
                            <ButtonGroup
                                sx={{ maxHeight: 40 }}
                                disableElevation
                                variant='contained'
                                aria-label='outlined primary button group'
                            >
                                <Box sx={{ width: 5 }} />
                                <ButtonGroup disableElevation aria-label='outlined primary button group'>
                                    <StyledButton variant='outlined' sx={{ maxHeight: 40 }} onClick={onRefresh} startIcon={<IconRefresh />}>
                                        Refresh
                                    </StyledButton>
                                    <StyledButton
                                        variant='contained'
                                        style={{ marginLeft: '18px' }}
                                        sx={{ maxHeight: 40 }}
                                        onClick={createEvaluation}
                                        startIcon={<IconPlus />}
                                    >
                                        New Evaluation
                                    </StyledButton>
                                </ButtonGroup>
                            </ButtonGroup>
                        </Toolbar>
                    </Box>
                    <TableContainer component={Paper}>
                        <Table aria-label='simple table'>
                            <TableHead>
                                <TableRow>
                                    <TableCell width='10%'>Status</TableCell>
                                    <TableCell width='15%'>Date</TableCell>
                                    <TableCell width='10%'>Name</TableCell>
                                    <TableCell width='10%'>Type</TableCell>
                                    <TableCell width='15%'>Chatflow</TableCell>
                                    <TableCell width='15%'>Dataset</TableCell>
                                    <TableCell width='15%'>Avg. Metrics</TableCell>
                                    <TableCell width='10%' colSpan='2'>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.length === 0 && (
                                    <TableRow sx={{ border: 1 }}>
                                        <TableCell colSpan='6'>
                                            <div>No Items Yet</div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {rows.length > 0 &&
                                    rows.map((item, index) => (
                                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>{item.status === 'pending' ? 'Pending' : 'Complete'}</TableCell>
                                            <TableCell>{moment(item.runDate).format('DD-MMM-YY HH:MM:SS')}</TableCell>
                                            <TableCell>
                                                <Button onClick={() => goToRows(item)} sx={{ textAlign: 'left' }}>
                                                    {item.name}
                                                </Button>
                                            </TableCell>
                                            <TableCell>{item.evaluationType}</TableCell>
                                            <TableCell>{item.chatflowName}</TableCell>
                                            <TableCell>{item.datasetName}</TableCell>
                                            <TableCell>
                                                {item.average_metrics?.totalRuns && (
                                                    <div> Num of Runs: {item?.average_metrics?.totalRuns}</div>
                                                )}
                                                {item.average_metrics?.averageCost && <div> Avg Cost: 0</div>}
                                                {item.average_metrics?.averageLatency && (
                                                    <div> Avg Latency: {item?.average_metrics?.averageLatency}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton title='Run Details' color='primary' onClick={() => goToRows(item)}>
                                                    <IconTable />
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton title='Delete' color='error'>
                                                    <IconTrash />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            </MainCard>
            <CreateEvaluationDialog
                show={showNewEvaluationDialog}
                dialogProps={dialogProps}
                onCancel={() => setShowNewEvaluationDialog(false)}
                onConfirm={onConfirm}
            ></CreateEvaluationDialog>
            {loading && <BackdropLoader open={loading} />}
        </div>
    )
}

export default EvalsEvaluation
