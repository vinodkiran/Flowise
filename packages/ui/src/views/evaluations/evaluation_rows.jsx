import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

// material-ui
import {
    Box,
    Toolbar,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Typography,
    Breadcrumbs,
    Divider,
    Card,
    CardContent,
    Chip
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'

// API
import useNotifier from '@/utils/useNotifier'
import useApi from '@/hooks/useApi'
import evaluationApi from '@/api/evaluation'

// Hooks

// icons
import Link from '@mui/material/Link'
import moment from 'moment'

// ==============================|| Datasets ||============================== //

const EvalEvaluationRows = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()
    useNotifier()

    const [rows, setRows] = useState([])
    const [selectedEvaluationName, setSelectedEvaluationName] = useState('')
    const [evaluation, setEvaluation] = useState({})
    const getEvaluation = useApi(evaluationApi.getEvaluation)

    const URLpath = document.location.pathname.toString().split('/')
    const evalId = URLpath[URLpath.length - 1] === 'evaluation_rows' ? '' : URLpath[URLpath.length - 1]

    const breadcrumbs = [
        <Link underline='hover' key='1' color='inherit'>
            {''}
        </Link>,
        <Link underline='hover' key='2' color='inherit' href='/evaluation'>
            Evaluations
        </Link>,
        <Typography key='3' color='text.primary'>
            {selectedEvaluationName}
        </Typography>
    ]

    useEffect(() => {
        getEvaluation.request(evalId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getEvaluation.data) {
            setSelectedEvaluationName(getEvaluation.data.name)
            const rows = getEvaluation.data.rows
            for (let i = 0; i < rows.length; i++) {
                rows[i].metrics = JSON.parse(rows[i].metrics)
            }
            setRows(rows)
            const evaluation = getEvaluation.data
            evaluation.average_metrics = JSON.parse(evaluation.average_metrics)
            setEvaluation(evaluation)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getEvaluation.data])

    return (
        <>
            <MainCard sx={{ background: customization.isDarkMode ? theme.palette.common.black : '' }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Breadcrumbs separator='›' aria-label='breadcrumb'>
                        {breadcrumbs}
                    </Breadcrumbs>
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                    <Toolbar
                        disableGutters={true}
                        style={{
                            margin: 1,
                            padding: 1,
                            paddingBottom: 10,
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%'
                        }}
                    >
                        <h1 style={{ marginRight: '18px' }}>Evaluation : {selectedEvaluationName}</h1>
                    </Toolbar>
                </Box>
                <Card
                    sx={{
                        border: '1px solid',
                        borderColor: theme.palette.primary[200] + 75,
                        boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)'
                    }}
                >
                    <CardContent>
                        <Table aria-label='simple table'>
                            <TableHead>
                                <TableRow>
                                    <TableCell width='20%'> Evaluation Type</TableCell>
                                    <TableCell width='30%'>{evaluation?.evaluationType?.toUpperCase()}</TableCell>
                                    <TableCell width='20%'> Run Date / Time</TableCell>
                                    <TableCell width='30%'>{moment(evaluation?.runDate).format('DD-MMM-YY HH:MM:SS')}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell> Chatflow</TableCell>
                                    <TableCell>{evaluation?.chatflowName}</TableCell>
                                    <TableCell> Dataset</TableCell>
                                    <TableCell>{evaluation?.datasetName}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell> Avg Latency</TableCell>
                                    <TableCell>{evaluation?.average_metrics?.averageLatency}</TableCell>
                                    <TableCell> Avg Cost</TableCell>
                                    <TableCell>{evaluation?.average_metrics?.averageCost || 'N/A'}</TableCell>
                                </TableRow>
                            </TableHead>
                        </Table>
                    </CardContent>
                </Card>
                <Divider />
                <TableContainer sx={{ paddingTop: 5 }}>
                    <Table aria-label='simple table'>
                        <TableHead>
                            <TableRow>
                                <TableCell>Input</TableCell>
                                <TableCell>Anticipated Output</TableCell>
                                <TableCell>Actual Output</TableCell>
                                {evaluation?.evaluationType === 'llm' && (
                                    <>
                                        <TableCell>Reasoning</TableCell>
                                        <TableCell>Score</TableCell>
                                    </>
                                )}
                                <TableCell>Tokens</TableCell>
                                <TableCell>Latency</TableCell>
                                <TableCell>Cost</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length === 0 && (
                                <TableRow sx={{ border: 1 }}>
                                    <TableCell colSpan='5'>
                                        <div>No Items Yet</div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.length > 0 &&
                                rows.map((item, index) => (
                                    <>
                                        <TableRow key={index} sx={{ border: 0 }}>
                                            <TableCell sx={{ border: 0 }}>{item.input}</TableCell>
                                            <TableCell sx={{ border: 0 }}>{item.expectedOutput}</TableCell>
                                            <TableCell sx={{ border: 0 }}>{item.actualOutput}</TableCell>
                                            {evaluation?.evaluationType === 'llm' && (
                                                <>
                                                    <TableCell sx={{ border: 0 }}>{item?.reasoning}</TableCell>
                                                    <TableCell sx={{ border: 0 }}>{item?.score}</TableCell>
                                                </>
                                            )}
                                            <TableCell
                                                sx={{ border: 0 }}
                                                width='10%'
                                                style={{ whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: '10%' }}
                                            >
                                                <Chip
                                                    style={{ marginBottom: '4px' }}
                                                    variant='outlined'
                                                    size='small'
                                                    color='info'
                                                    label={
                                                        item.metrics?.promptTokens ? 'Prompt: ' + item.metrics?.promptTokens : 'Prompt: N/A'
                                                    }
                                                />{' '}
                                                <Chip
                                                    style={{ marginBottom: '4px' }}
                                                    variant='outlined'
                                                    size='small'
                                                    color='info'
                                                    label={
                                                        item.metrics?.responseTokens
                                                            ? 'Response: ' + item.metrics?.responseTokens
                                                            : 'Response: N/A'
                                                    }
                                                />{' '}
                                                <Chip
                                                    style={{ marginBottom: '4px' }}
                                                    variant='outlined'
                                                    size='small'
                                                    color='info'
                                                    label={item.metrics?.totalTokens ? 'Total: ' + item.metrics?.totalTokens : 'Total: N/A'}
                                                />{' '}
                                            </TableCell>
                                            <TableCell
                                                sx={{ border: 0 }}
                                                width='10%'
                                                style={{ whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: '10%' }}
                                            >
                                                <Chip
                                                    style={{ marginBottom: '4px' }}
                                                    variant='outlined'
                                                    size='small'
                                                    color='info'
                                                    label={item.metrics?.apiLatency ? 'API: ' + item.metrics?.apiLatency : 'API: N/A'}
                                                />{' '}
                                                <Chip
                                                    style={{ marginBottom: '4px' }}
                                                    variant='outlined'
                                                    size='small'
                                                    color='info'
                                                    label={item.metrics?.chain ? 'Chain: ' + item.metrics?.chain : 'Chain: N/A'}
                                                />{' '}
                                                <Chip
                                                    style={{ marginBottom: '4px' }}
                                                    variant='outlined'
                                                    size='small'
                                                    color='info'
                                                    label={item.metrics?.llm ? 'LLM: ' + item.metrics?.llm : 'LLM: N/A'}
                                                />{' '}
                                            </TableCell>
                                            <TableCell sx={{ border: 0 }} width='10%'>
                                                0
                                            </TableCell>
                                        </TableRow>
                                    </>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </MainCard>
        </>
    )
}

export default EvalEvaluationRows
