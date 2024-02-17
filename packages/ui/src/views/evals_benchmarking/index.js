import { useEffect } from 'react'
import { useSelector } from 'react-redux'

// material-ui
import { Grid, Box, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from 'ui-component/cards/MainCard'
import { gridSpacing } from 'store/constant'

// API

// Hooks

// icons

// ==============================|| CHATFLOWS ||============================== //

const EvalBenchMarking = () => {
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
                        <h1>Benchmarking</h1>
                        <Box sx={{ flexGrow: 1 }} />
                        {/*<Grid item>*/}
                        {/*    <Button variant='outlined' sx={{ mr: 2 }} onClick={loadExisting} startIcon={<IconFileImport />}>*/}
                        {/*        Load*/}
                        {/*    </Button>*/}
                        {/*    <StyledButton variant='contained' sx={{ color: 'white' }} onClick={addNew} startIcon={<IconPlus />}>*/}
                        {/*        Add*/}
                        {/*    </StyledButton>*/}
                        {/*</Grid>*/}
                    </Grid>
                </Stack>
                <Grid container spacing={gridSpacing}>
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

export default EvalBenchMarking
