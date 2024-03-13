import { useEffect } from 'react'
import { useSelector } from 'react-redux'

// material-ui
import { Grid, Box, ButtonGroup, Stack, Divider, Breadcrumbs, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import { gridSpacing } from '@/store/constant'
import Link from '@mui/material/Link'
import { MetricsLineChart } from '@/ui-component/charts/MetricsLineChart'
import MetricsItemCard from '@/ui-component/cards/MetricsItemCard'
import MetricsDateToolbar from '@/ui-component/toolbar/MetricsDateToolbar'
import { StyledButton } from '@/ui-component/button/StyledButton'

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
        Latency
    </Typography>
]

const EvalMetrics = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
                        <h1>Metrics - Latency</h1>
                        <Box sx={{ flexGrow: 1 }} />
                        <ButtonGroup sx={{ maxHeight: 40 }} disableElevation variant='contained' aria-label='outlined primary button group'>
                            <MetricsDateToolbar />
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
                                    data={{ header: 'AVERAGE LATENCY', value: '2,876 ms' }}
                                    component={<MetricsLineChart chartType={'AVG_LATENCY'} sx={{ pt: 2 }} />}
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
