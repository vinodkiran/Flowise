import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

// material-ui
import {
    Grid,
    Box,
    ButtonGroup,
    Stack,
    Divider,
    Breadcrumbs,
    Typography,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    Paper
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from 'ui-component/cards/MainCard'
import { gridSpacing } from 'store/constant'
import MetricsItemCard from '../../ui-component/cards/MetricsItemCard'
import { MetricsBarChart } from '../../ui-component/charts/MetricsBarChart'
import Link from '@mui/material/Link'
import MetricsDateToolbar from '../../ui-component/toolbar/MetricsDateToolbar'
import { StyledButton } from '../../ui-component/button/StyledButton'
import useApi from '../../hooks/useApi'
import metricsApi from '../../api/metrics'
import TableCell from '@mui/material/TableCell'

// API

// Hooks

// icons

// ==============================|| CHATFLOWS ||============================== //

const breadcrumbs = [
    <Link underline='hover' key='1' color='inherit'>
        {''}
    </Link>,
    <Link underline='hover' key='2' color='inherit' href='/metrics'>
        Metrics
    </Link>,
    <Typography key='3' color='text.primary'>
        Inferences
    </Typography>
]

const EvalMetrics = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const getInferencesApi = useApi(metricsApi.getInferences)
    const [inferenceData, setInferenceData] = useState([])
    const [filterData, setFilterData] = useState('')
    const [totalInferenceCount, setTotalInferenceCount] = useState(0)

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
        getInferencesApi.request({
            chatflowId: undefined,
            startDate: startDate,
            endDate: endDate,
            chatType: undefined,
            summaryOrDetail: 'detail'
        })
    }

    useEffect(() => {
        dateFilterChange()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getInferencesApi.data) {
            const originalData = getInferencesApi.data
            setInferenceData(originalData)
            setFilterData('')
            setTotalInferenceCount(getInferencesApi.data.totalCount)
        }
    }, [getInferencesApi.data])

    const handleClick = (data, index) => {
        let dateFilter = data.payload.x
        let compareDate = new Date(dateFilter)
        let month = compareDate.getMonth() + 1
        let day = compareDate.getDate()
        let dateFilterString = compareDate.getFullYear() + '-' + (month < 9 ? '0' + month : month) + '-' + (day < 9 ? '0' + day : day) + 'T'
        setFilterData(dateFilterString)
        console.log('filterData', dateFilterString)
    }

    const filterByDate = (data) => {
        if (filterData === '') return data
        return data.createdDate.startsWith(filterData)
    }

    return (
        <>
            <MainCard sx={{ background: customization.isDarkMode ? theme.palette.common.black : '' }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Breadcrumbs separator='›' aria-label='breadcrumb'>
                        {breadcrumbs}
                    </Breadcrumbs>
                </Box>
                <Stack flexDirection='row'>
                    <Grid sx={{ mb: 1.25 }} container direction='row'>
                        <h1>Metrics - Inference</h1>
                        <Box sx={{ flexGrow: 1 }} />
                        <ButtonGroup sx={{ maxHeight: 40 }} disableElevation variant='contained' aria-label='outlined primary button group'>
                            <MetricsDateToolbar initialState={''} onDateFilterChange={dateFilterChange} toolbarType={'Dashboard'} />
                            <Box sx={{ width: 5 }} />
                            <ButtonGroup disableElevation aria-label='outlined primary button group'>
                                <StyledButton variant='contained'>Refresh</StyledButton>
                            </ButtonGroup>
                        </ButtonGroup>
                    </Grid>
                </Stack>
                <Divider />
                <Stack flexDirection='row'>
                    <Grid container spacing={gridSpacing} sx={{ mt: 1, alignItems: 'center' }}>
                        <Grid key='0' item lg={12} md={12} sm={12} xs={12}>
                            <Stack flexDirection='column' rowGap={2}>
                                <MetricsItemCard
                                    data={{ header: 'TOTAL INFERENCES', value: totalInferenceCount }}
                                    component={
                                        <MetricsBarChart
                                            data={inferenceData.summary}
                                            onBarClick={handleClick}
                                            chartType={'TOTAL_INFERENCES'}
                                            sx={{ pt: 2 }}
                                        />
                                    }
                                />
                            </Stack>
                        </Grid>
                    </Grid>
                </Stack>
                {/*{!getAllAssistantsApi.loading && (!getAllAssistantsApi.data || getAllAssistantsApi.data.length === 0) && (*/}
                {/*    <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>*/}
                {/*        <Box sx={{ p: 2, height: 'auto' }}>*/}
                {/*            <img style={{ objectFit: 'cover', height: '30vh', width: 'auto' }} src={ToolEmptySVG} alt='ToolEmptySVG' />*/}
                {/*        </Box>*/}
                {/*        <div>No Assistants Added Yet</div>*/}
                {/*    </Stack>*/}
                {/*)}*/}
            </MainCard>
            <TableContainer sx={{ mt: 2 }} component={Paper}>
                <Table sx={{ minWidth: 650 }} size='small' aria-label='a dense table'>
                    <TableHead>
                        <TableRow>
                            {filterData && (
                                <TableCell colSpan={6} align='center'>
                                    {inferenceData.messages?.filter(filterByDate).length} calls on {filterData.substring(0, 10)}
                                </TableCell>
                            )}
                        </TableRow>
                        <TableRow>
                            <TableCell align={'center'}>#</TableCell>
                            <TableCell>Chatflow Name</TableCell>
                            <TableCell>Called From</TableCell>
                            <TableCell>Date/Time</TableCell>
                            <TableCell>Feedback</TableCell>
                            <TableCell>Latency</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {inferenceData.messages?.filter(filterByDate).map((row, index) => (
                            <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell align={'center'}>{index + 1}</TableCell>
                                <TableCell component='th' scope='row'>
                                    {row.chatflowid}
                                </TableCell>
                                <TableCell>{row.chatType === 'INTERNAL' ? 'UI' : 'API/Chat'}</TableCell>
                                <TableCell>{row.createdDate}</TableCell>
                                <TableCell> </TableCell>
                                <TableCell> 0.0 ms </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    )
}

export default EvalMetrics
