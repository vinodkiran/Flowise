import { useEffect } from 'react'
import { useSelector } from 'react-redux'

// material-ui
import { Grid, Box, Toolbar, TextField, ButtonGroup, Stack, Divider } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from 'ui-component/cards/MainCard'
import { gridSpacing } from 'store/constant'
import { StyledButton } from '../../ui-component/button/StyledButton'
import MetricsItemCard from '../../ui-component/cards/MetricsItemCard'

// API

// Hooks

// icons

// ==============================|| CHATFLOWS ||============================== //

const EvalMetrics = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <>
            <MainCard sx={{ background: customization.isDarkMode ? theme.palette.common.black : '' }}>
                <Stack flexDirection='row'>
                    <Grid sx={{ mb: 1.25 }} container direction='row'>
                        <h1>Metrics</h1>
                        <Box sx={{ flexGrow: 1 }} />
                    </Grid>
                </Stack>
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
                        <TextField
                            size='small'
                            sx={{ display: { xs: 'none', sm: 'block' }, ml: 0 }}
                            variant='outlined'
                            placeholder='Search name or category'
                        />
                        <Box sx={{ flexGrow: 1 }} />
                        <ButtonGroup sx={{ maxHeight: 40 }} disableElevation variant='contained' aria-label='outlined primary button group'>
                            <Box sx={{ width: 5 }} />
                            <ButtonGroup disableElevation aria-label='outlined primary button group'>
                                <StyledButton variant='contained'>Submit</StyledButton>
                            </ButtonGroup>
                        </ButtonGroup>
                    </Toolbar>
                </Box>
                <Divider />
                <Grid container spacing={gridSpacing} sx={{ mt: 2, alignItems: 'center' }}>
                    <Grid key='0' item lg={3} md={4} sm={6} xs={12}>
                        <MetricsItemCard data={{ header: 'TOTAL INFERENCES', value: '41' }} />
                    </Grid>
                    <Grid key='1' item lg={3} md={4} sm={6} xs={12}>
                        <MetricsItemCard data={{ header: 'AVERAGE COST', value: '$5.8452' }} />
                    </Grid>
                    <Grid key='2' item lg={3} md={4} sm={6} xs={12}>
                        <MetricsItemCard data={{ header: 'AVERAGE LATENCY', value: '2345 ms' }} />
                    </Grid>
                    <Grid key='3' item lg={3} md={4} sm={6} xs={12}>
                        <MetricsItemCard data={{ header: 'AVERAGE TOKEN USAGE', value: '421' }} />
                    </Grid>
                    {/*{!getAllAssistantsApi.loading &&*/}
                    {/*    getAllAssistantsApi.data &&*/}
                    {/*    getAllAssistantsApi.data.map((data, index) => (*/}
                    {/*        <Grid key={index} item lg={3} md={4} sm={6} xs={12}>*/}
                    {/*            <ItemCard*/}
                    {/*                data={{*/}
                    {/*                    name: JSON.parse(data.details)?.name,*/}
                    {/*                    description: JSON.parse(data.details)?.instructions,*/}
                    {/*                    iconSrc: data.iconSrc*/}
                    {/*                }}*/}
                    {/*                onClick={() => edit(data)}*/}
                    {/*            />*/}
                    {/*        </Grid>*/}
                    {/*    ))}*/}
                </Grid>
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
