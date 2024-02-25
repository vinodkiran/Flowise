import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

// material-ui
import { Grid, Box, Toolbar, ButtonGroup, Stack, Divider } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from 'ui-component/cards/MainCard'
import { gridSpacing } from 'store/constant'
import { StyledButton } from '../../ui-component/button/StyledButton'
import MetricsItemCard from '../../ui-component/cards/MetricsItemCard'
import { MetricsLineChart } from '../../ui-component/charts/MetricsLineChart'
import { MetricsBarChart } from '../../ui-component/charts/MetricsBarChart'
import { useNavigate } from 'react-router-dom'
import chatflowsApi from 'api/chatflows'
import metricsApi from 'api/metrics'
import useApi from '../../hooks/useApi'
import { Dropdown } from '../../ui-component/dropdown/Dropdown'
import MetricsDateToolbar from '../../ui-component/toolbar/MetricsDateToolbar'
import { MetricsPercentAreaChart } from '../../ui-component/charts/MetricsPercentAreaChart'

// API

// Hooks

// icons

// ==============================|| CHATFLOWS ||============================== //

const EvalMetrics = () => {
    const navigate = useNavigate()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const getAllChatflowsApi = useApi(chatflowsApi.getAllChatflows)
    const getInferencesApi = useApi(metricsApi.getInferences)
    const [selectedChatflow, setSelectedChatflow] = useState('all')
    const [inferenceData, setInferenceData] = useState([])
    const [totalInferenceCount, setTotalInferenceCount] = useState(0)
    const [flows, setFlows] = useState([])

    useEffect(() => {
        if (flows.length === 0) {
            getAllChatflowsApi.request()
            dateFilterChange()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getInferencesApi.data) {
            const originalData = getInferencesApi.data.summary
            setInferenceData(originalData)
            setTotalInferenceCount(getInferencesApi.data.totalCount)
        }
    }, [getInferencesApi.data])

    useEffect(() => {
        if (getAllChatflowsApi.data) {
            try {
                const chatflows = getAllChatflowsApi.data
                let flowNames = [
                    {
                        label: '<All>',
                        name: ''
                    }
                ]
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

    const gotoDetails = (chartType) => {
        switch (chartType) {
            case 'AVG_LATENCY':
                navigate(`/metrics_latency`)
                break
            case 'TOTAL_INFERENCES':
                navigate(`/metrics_inferences`)
                break
        }
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
        getInferencesApi.request({
            chatflowId: selectedChatflow === '' || selectedChatflow === 'all' ? undefined : selectedChatflow,
            startDate: startDate,
            endDate: endDate,
            chatType: undefined,
            summaryOrDetail: 'summary'
        })
    }

    return (
        <>
            <MainCard sx={{ background: customization.isDarkMode ? theme.palette.common.black : '' }}>
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
                        <h1 style={{ marginRight: '18px' }}>Metrics</h1>
                        <Dropdown
                            fullWidth
                            name='chatflow'
                            defaultOption='Select Chatflow'
                            options={flows}
                            onSelect={(newValue) => {
                                setSelectedChatflow(newValue)
                            }}
                            value={selectedChatflow}
                        />
                        <Box sx={{ flexGrow: 1 }} />
                        <ButtonGroup
                            style={{ marginLeft: '18px' }}
                            sx={{ maxHeight: 40 }}
                            disableElevation
                            variant='contained'
                            aria-label='outlined primary button group'
                        >
                            <MetricsDateToolbar onDateFilterChange={dateFilterChange} />
                            <Box sx={{ width: 5 }} />
                            <ButtonGroup disableElevation aria-label='outlined primary button group'>
                                <StyledButton onClick={dateFilterChange} style={{ marginLeft: '18px' }} variant='contained'>
                                    Refresh
                                </StyledButton>
                            </ButtonGroup>
                        </ButtonGroup>
                    </Toolbar>
                </Box>
                <Divider />
                <Stack flexDirection='row'>
                    <Grid container spacing={gridSpacing} sx={{ mt: 1, alignItems: 'center' }}>
                        <Grid key='1' item lg={6} md={6} sm={12} xs={12}>
                            <Stack flexDirection='column' rowGap={2}>
                                <MetricsItemCard
                                    data={{ header: 'AVERAGE LATENCY', value: '2,876 ms' }}
                                    component={
                                        <MetricsLineChart
                                            chartType={'AVG_LATENCY'}
                                            sx={{ pt: 2 }}
                                            onClick={() => gotoDetails('AVG_LATENCY')}
                                        />
                                    }
                                />
                            </Stack>
                        </Grid>
                        <Grid key='0' item lg={6} md={6} sm={12} xs={12}>
                            <Stack flexDirection='column' rowGap={2}>
                                <MetricsItemCard
                                    data={{ header: 'TOTAL INFERENCES', value: totalInferenceCount }}
                                    component={
                                        <MetricsBarChart
                                            chartType={'TOTAL_INFERENCES'}
                                            sx={{ pt: 2 }}
                                            data={inferenceData}
                                            onClick={() => gotoDetails('TOTAL_INFERENCES')}
                                        />
                                    }
                                />
                            </Stack>
                        </Grid>
                        <Grid key='2' item lg={6} md={6} sm={12} xs={12}>
                            <Stack flexDirection='column' rowGap={2}>
                                <MetricsItemCard
                                    data={{ header: 'FEEDBACK', value: '20' }}
                                    component={<MetricsPercentAreaChart chartType={'FEEDBACK'} sx={{ pt: 2 }} />}
                                />
                            </Stack>
                        </Grid>
                        <Grid key='3' item lg={6} md={6} sm={12} xs={12}>
                            <Stack flexDirection='column' rowGap={2}>
                                <MetricsItemCard
                                    data={{ header: 'AVERAGE COST', value: '$5.8452' }}
                                    component={<MetricsLineChart chartType={'AVG_COST'} sx={{ pt: 2 }} />}
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
        </>
    )
}

export default EvalMetrics
