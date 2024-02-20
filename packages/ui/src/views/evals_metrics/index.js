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
import useApi from '../../hooks/useApi'
import { Dropdown } from '../../ui-component/dropdown/Dropdown'
import MetricsDateToolbar from '../../ui-component/toolbar/MetricsDateToolbar'

// API

// Hooks

// icons

// ==============================|| CHATFLOWS ||============================== //

const EvalMetrics = () => {
    const navigate = useNavigate()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const getAllChatflowsApi = useApi(chatflowsApi.getAllChatflows)
    const [selectedChatflow, setSelectedChatflow] = useState('all')
    const [flows, setFlows] = useState([])

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
                let flowNames = [
                    {
                        label: '<All>',
                        name: 'all'
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
                            onSelect={(newValue) => setSelectedChatflow(newValue)}
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
                            <MetricsDateToolbar initialState={''} toolbarType={'Dashboard'} />
                            <Box sx={{ width: 5 }} />
                            <ButtonGroup disableElevation aria-label='outlined primary button group'>
                                <StyledButton style={{ marginLeft: '18px' }} variant='contained'>
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
                                    data={{ header: 'TOTAL INFERENCES', value: '59' }}
                                    component={
                                        <MetricsBarChart
                                            chartType={'TOTAL_INFERENCES'}
                                            sx={{ pt: 2 }}
                                            onClick={() => gotoDetails('TOTAL_INFERENCES')}
                                        />
                                    }
                                />
                            </Stack>
                        </Grid>
                        <Grid key='2' item lg={6} md={6} sm={12} xs={12}>
                            <Stack flexDirection='column' rowGap={2}>
                                <MetricsItemCard
                                    data={{ header: 'AVG TOKENS USED', value: '20' }}
                                    component={<MetricsBarChart chartType={'AVG_TOKENS'} sx={{ pt: 2 }} />}
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
