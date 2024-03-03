import { useEffect, useState } from 'react'
import axios from 'axios'

// material-ui
import {
    Box,
    Button,
    ButtonGroup,
    Card,
    CardContent,
    Divider,
    Grid,
    Paper,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    Toolbar,
    Typography
} from '@mui/material'
import { Dropdown } from '../../ui-component/dropdown/Dropdown'

// API
import chatflowsApi from 'api/chatflows'
import useApi from '../../hooks/useApi'

// const
import { baseURL } from 'store/constant'
import TableCell from '@mui/material/TableCell'
import { BackdropLoader } from 'ui-component/loading/BackdropLoader'
import MainCard from '../../ui-component/cards/MainCard'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import MetricsDateToolbar from '../../ui-component/toolbar/MetricsDateToolbar'

const EvalsBenchMarking = () => {
    const navigate = useNavigate()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const getAllChatflowsApi = useApi(chatflowsApi.getAllChatflows)
    const [chatflow1, setChatflow1] = useState('')
    const [chatflow2, setChatflow2] = useState('')
    const [flows, setFlows] = useState([])
    const [showSummary, setShowSummary] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [loading, setLoading] = useState(false)

    const [inputFields, setInputFields] = useState([{ prompt: '', chatflow1: '', chatflow2: '' }])
    useEffect(() => {
        if (flows.length === 0) {
            getAllChatflowsApi.request()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllChatflowsApi.data) {
            try {
                const chatflows = getAllChatflowsApi.data
                let flowNames = []
                for (let i = 0; i < chatflows.length; i += 1) {
                    const flow = chatflows[i]
                    flowNames.push({
                        label: flow.name,
                        name: flow.id
                    })
                }
                setFlows(flowNames)
            } catch (e) {
                console.error(e)
            }
        }
    }, [getAllChatflowsApi.data])

    const addInputField = () => {
        setInputFields([...inputFields, { prompt: '', chatflow1: '', chatflow2: '' }])
    }
    const reset = () => {
        setChatflow1('')
        setChatflow2('')
        setInputFields([{ prompt: '', chatflow1: '', chatflow2: '' }])
        setShowResults(false)
    }

    const fetchSummary = async () => {
        setShowSummary(true)
    }

    const chatFlow1Name = '[ ' + flows.find((f) => f.name === chatflow1)?.label + ' ]'
    const chatFlow2Name = '[ ' + flows.find((f) => f.name === chatflow2)?.label + ' ]'

    const evaluate = async () => {
        setLoading(true)
        let updatedFields = await fetchPredictions()
        setInputFields(updatedFields)
        setShowResults(true)
        setLoading(false)
    }
    const fetchPredictions = async () => {
        const dataFields = [...inputFields]
        try {
            const promises = []
            dataFields.map(async (data, index) => {
                let startTime = performance.now()
                let response1 = axios
                    .post(`${baseURL}/api/v1/prediction/${chatflow1}`, { question: data.prompt })
                    .then(async function (response) {
                        const endTime = performance.now()
                        data.chatflow1time = (endTime - startTime).toFixed(2) + ' ms'
                        data.chatflow1 = response.data.text
                        inputFields[index].chatflow1 = response.data.text
                        return response.data
                    })
                    .catch(function (error) {
                        console.error(error)
                    })
                startTime = performance.now()
                let response2 = axios
                    .post(`${baseURL}/api/v1/prediction/${chatflow2}`, { question: data.prompt })
                    .then(async function (response) {
                        const endTime = performance.now()
                        data.chatflow2time = (endTime - startTime).toFixed(2) + ' ms'
                        data.chatflow2 = response.data.text
                        inputFields[index].chatflow2 = response.data.text
                        return response.data
                    })
                    .catch(function (error) {
                        data.chatflow2 = JSON.stringify(error)
                        inputFields[index].chatflow2 = JSON.stringify(error)
                        console.error(error)
                    })
                promises.push(response1)
                promises.push(response2)
            })
            await Promise.all(promises)
        } catch (e) {
            console.error(e)
        }
        return dataFields
    }

    const dateFilterChange = () => {
        let key = localStorage.getItem('metricsTimePeriod') || 'today'
        let startDate = new Date()
        let endDate = new Date()
        let numDays = 0
        switch (key) {
            case 'today':
                startDate.setDate(startDate.getDate() - 1)
                endDate = startDate
                break
            case 'yesterday':
                startDate.setDate(startDate.getDate() - 1)
                endDate = startDate
                break
            case '7d':
            case '15d':
            case '30d':
            case '60d':
            case '90d':
                numDays = parseInt(key.substring(0, key.length - 1))
                startDate.setDate(startDate.getDate() - numDays)
                break
        }
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        // getInferencesApi.request({
        //     chatflowId: selectedChatflow === '' || selectedChatflow === 'all' ? undefined : selectedChatflow,
        //     startDate: startDate,
        //     endDate: endDate,
        //     chatType: undefined,
        //     summaryOrDetail: 'summary'
        // })
    }

    const removeInputFields = (index) => {
        const rows = [...inputFields]
        rows.splice(index, 1)
        setInputFields(rows)
    }

    const handleChange = (index, evnt) => {
        const { name, value } = evnt.target
        const list = [...inputFields]
        list[index][name] = value
        setInputFields(list)
    }

    return (
        <div>
            <MainCard sx={{ background: customization.isDarkMode ? theme.palette.common.black : '' }}>
                {!showResults && (
                    <>
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
                                <h1 style={{ marginRight: '18px' }}>Benchmarking</h1>
                                <Dropdown
                                    name='chatflow1'
                                    defaultOption='Select Chatflow'
                                    options={flows}
                                    onSelect={(newValue) => setChatflow1(newValue)}
                                    value={chatflow1}
                                />
                                <div style={{ marginRight: '18px' }}>&nbsp;</div>
                                <Dropdown
                                    name={chatflow2}
                                    options={flows}
                                    defaultOption='Select Chatflow'
                                    onSelect={(newValue) => setChatflow2(newValue)}
                                    value={chatflow2}
                                />
                                <ButtonGroup
                                    style={{ marginLeft: '18px' }}
                                    sx={{ maxHeight: 40 }}
                                    disableElevation
                                    variant='contained'
                                    aria-label='outlined primary button group'
                                >
                                    <MetricsDateToolbar onDateFilterChange={dateFilterChange} />
                                </ButtonGroup>
                            </Toolbar>
                        </Box>
                        <Box>
                            <Typography variant='h5' color='text.secondary'>
                                Select upto 2 chatflows to evaluate
                            </Typography>
                        </Box>
                    </>
                )}
                <Box sx={{ p: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', pt: 1, textAlign: 'center' }}>
                        <Box sx={{ width: '100%' }}>
                            <Button variant='contained' color='error' sx={{ mr: 5 }} onClick={reset}>
                                Reset
                            </Button>
                            <Button variant='contained' color='primary' onClick={fetchSummary}>
                                Fetch
                            </Button>
                        </Box>
                    </Box>
                </Box>
                {showSummary && (
                    <>
                        <Grid container sx={{ mt: 1 }} direction='row' spacing={2}>
                            <Grid item lg={6} md={6} sm={6} xs={6}>
                                <Card
                                    sx={{
                                        border: '1px solid',
                                        borderColor: theme.palette.primary[200] + 75,
                                        boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)',
                                        ':hover': {
                                            boxShadow: '0 2px 14px 0 rgb(32 40 45)'
                                        }
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant='h3' gutterBottom>
                                            Feedback{' '}
                                            <span style={{ fontStyle: 'italic', fontSize: 12, color: 'text.secondary' }}>
                                                {chatFlow1Name}
                                            </span>
                                        </Typography>
                                        <Divider sx={{ mt: 1, mb: 0.5, color: '#000000' }} />
                                        <Grid container direction='row' spacing={2}>
                                            <Grid sx={{ textAlign: 'center' }} item lg={4} md={4} sm={4} xs={4}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Positive
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    10
                                                </Typography>
                                            </Grid>
                                            <Grid sx={{ textAlign: 'center' }} item lg={4} md={4} sm={4} xs={4}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Negative
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    Positive
                                                </Typography>
                                            </Grid>
                                            <Grid sx={{ textAlign: 'center' }} item lg={4} md={4} sm={4} xs={4}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Not Rated
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    Positive
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item lg={6} md={6} sm={6} xs={6}>
                                <Card
                                    sx={{
                                        border: '1px solid',
                                        borderColor: theme.palette.primary[200] + 75,
                                        boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)'
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant='h3' gutterBottom>
                                            Feedback{' '}
                                            <span style={{ fontStyle: 'italic', fontSize: 12, color: 'text.secondary' }}>
                                                {chatFlow2Name}
                                            </span>
                                        </Typography>
                                        <Divider sx={{ mt: 1, mb: 0.5, color: '#000000' }} />
                                        <Grid container direction='row' spacing={2}>
                                            <Grid sx={{ textAlign: 'center' }} item lg={4} md={4} sm={4} xs={4}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Positive
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    10
                                                </Typography>
                                            </Grid>
                                            <Grid sx={{ textAlign: 'center' }} item lg={4} md={4} sm={4} xs={4}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Negative
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    Positive
                                                </Typography>
                                            </Grid>
                                            <Grid sx={{ textAlign: 'center' }} item lg={4} md={4} sm={4} xs={4}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Not Rated
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    Positive
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                        <Grid container sx={{ mt: 1 }} direction='row' spacing={2}>
                            <Grid item lg={6} md={6} sm={6} xs={6}>
                                <Card
                                    sx={{
                                        border: '1px solid',
                                        borderColor: theme.palette.primary[200] + 75,
                                        boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)'
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant='h3' gutterBottom>
                                            Latency{' '}
                                            <span style={{ fontStyle: 'italic', fontSize: 12, color: 'text.secondary' }}>
                                                {chatFlow1Name}
                                            </span>
                                        </Typography>
                                        <Divider sx={{ mt: 1, mb: 0.5, color: '#000000' }} />
                                        <Grid container direction='row' spacing={2}>
                                            <Grid sx={{ textAlign: 'center' }} item lg={6} md={6} sm={6} xs={6}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Total Completions
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    10
                                                </Typography>
                                            </Grid>
                                            <Grid sx={{ textAlign: 'center' }} item lg={6} md={6} sm={6} xs={6}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Avg Latency
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    2323 ms
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item lg={6} md={6} sm={6} xs={6}>
                                <Card
                                    sx={{
                                        border: '1px solid',
                                        borderColor: theme.palette.primary[200] + 75,
                                        boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)'
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant='h3' gutterBottom>
                                            Latency{' '}
                                            <span style={{ fontStyle: 'italic', fontSize: 12, color: 'text.secondary' }}>
                                                {chatFlow2Name}
                                            </span>
                                        </Typography>
                                        <Divider sx={{ mt: 1, mb: 0.5, color: '#000000' }} />
                                        <Grid container direction='row' spacing={2}>
                                            <Grid sx={{ textAlign: 'center' }} item lg={6} md={6} sm={6} xs={6}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Total Completions
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    10
                                                </Typography>
                                            </Grid>
                                            <Grid sx={{ textAlign: 'center' }} item lg={6} md={6} sm={6} xs={6}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Avg Latency
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    3423 ms
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                        <Grid container sx={{ mt: 1 }} direction='row' spacing={2}>
                            <Grid item lg={6} md={6} sm={6} xs={6}>
                                <Card
                                    sx={{
                                        border: '1px solid',
                                        borderColor: theme.palette.primary[200] + 75,
                                        boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)'
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant='h3' gutterBottom>
                                            Tokens &amp; Cost{' '}
                                            <span style={{ fontStyle: 'italic', fontSize: 12, color: 'text.secondary' }}>
                                                {chatFlow1Name}
                                            </span>
                                        </Typography>
                                        <Divider sx={{ mt: 1, mb: 0.5, color: '#000000' }} />
                                        <Grid container direction='row' spacing={2}>
                                            <Grid sx={{ textAlign: 'center' }} item lg={4} md={4} sm={4} xs={4}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Total Tokens
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    10
                                                </Typography>
                                            </Grid>
                                            <Grid sx={{ textAlign: 'center' }} item lg={4} md={4} sm={4} xs={4}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Avg Tokens
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    Positive
                                                </Typography>
                                            </Grid>
                                            <Grid sx={{ textAlign: 'center' }} item lg={4} md={4} sm={4} xs={4}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Total Cost
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    $ 19.99
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item lg={6} md={6} sm={6} xs={6}>
                                <Card
                                    sx={{
                                        border: '1px solid',
                                        borderColor: theme.palette.primary[200] + 75,
                                        boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)'
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant='h3' gutterBottom>
                                            Tokens &amp; Cost{' '}
                                            <span style={{ fontStyle: 'italic', fontSize: 12, color: 'text.secondary' }}>
                                                {chatFlow2Name}
                                            </span>
                                        </Typography>
                                        <Divider sx={{ mt: 1, mb: 0.5, color: '#000000' }} />
                                        <Grid container direction='row' spacing={2}>
                                            <Grid sx={{ textAlign: 'center' }} item lg={4} md={4} sm={4} xs={4}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Total Tokens
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    10
                                                </Typography>
                                            </Grid>
                                            <Grid sx={{ textAlign: 'center' }} item lg={4} md={4} sm={4} xs={4}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Avg Tokens
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    Positive
                                                </Typography>
                                            </Grid>
                                            <Grid sx={{ textAlign: 'center' }} item lg={4} md={4} sm={4} xs={4}>
                                                <Typography variant='h5' color='text.secondary' sx={{ mt: 1 }} gutterBottom>
                                                    Total Cost
                                                </Typography>
                                                <Typography variant='h3' sx={{ mt: 2 }} gutterBottom>
                                                    $ 19.99
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </>
                )}
                {showResults && (
                    <TableContainer component={Paper}>
                        <Table aria-label='prediction table'>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Input</TableCell>
                                    <TableCell sx={{ maxWidth: '40%' }} align='left'>
                                        {flows.find((f) => f.name === chatflow1).label}
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: '40%' }} align='left'>
                                        {flows.find((f) => f.name === chatflow2).label}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {inputFields.map((row) => (
                                    <>
                                        <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell component='th' scope='row' sx={{ maxWidth: '20%' }}>
                                                {row.prompt}
                                            </TableCell>
                                            <TableCell
                                                style={{
                                                    whiteSpace: 'normal',
                                                    wordWrap: 'break-word',
                                                    maxWidth: '40%'
                                                }}
                                                align='left'
                                            >
                                                {row.chatflow1}
                                                <Typography sx={{ display: 'flex' }} variant='caption' component='subtitle2'>
                                                    {row.chatflow1time}
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                style={{
                                                    whiteSpace: 'normal',
                                                    wordWrap: 'break-word',
                                                    maxWidth: '40%'
                                                }}
                                                align='left'
                                            >
                                                {row.chatflow2}
                                                <Typography sx={{ display: 'flex' }} variant='caption' component='subtitle2'>
                                                    {row.chatflow2time}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                {loading && <BackdropLoader open={loading} />}
            </MainCard>
        </div>
    )
}

export default EvalsBenchMarking
