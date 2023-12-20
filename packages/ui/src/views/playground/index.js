import { useEffect } from 'react'
import { useSelector } from 'react-redux'

// material-ui
import { Box, Stack, Toolbar, ToggleButton, ButtonGroup } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from 'ui-component/cards/MainCard'
// icons
import * as React from 'react'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Chunking from './chunking'
import Evaluation from './evaluation'

// ==============================|| CHATFLOWS ||============================== //

const Playground = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const [view, setView] = React.useState(localStorage.getItem('playground') || 'chunking')

    const handleChange = (event, nextView) => {
        localStorage.setItem('playground', nextView)
        setView(nextView)
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <MainCard sx={{ background: customization.isDarkMode ? theme.palette.common.black : '' }}>
            <Stack flexDirection='column'>
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
                        <h1>Flowise Playground</h1>
                        <Box sx={{ flexGrow: 1 }} />
                        <ButtonGroup sx={{ maxHeight: 40 }} disableElevation variant='contained' aria-label='outlined primary button group'>
                            <ButtonGroup disableElevation variant='contained' aria-label='outlined primary button group'>
                                <ToggleButtonGroup sx={{ maxHeight: 40 }} value={view} color='primary' exclusive onChange={handleChange}>
                                    <ToggleButton
                                        sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}
                                        variant='contained'
                                        value='chunking'
                                        title='Card View'
                                    >
                                        Chunking (Text Splitting)
                                    </ToggleButton>
                                    <ToggleButton
                                        sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}
                                        variant='contained'
                                        value='evaluation'
                                        title='List View'
                                    >
                                        Evaluate Chatflow
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </ButtonGroup>
                        </ButtonGroup>
                    </Toolbar>
                </Box>
            </Stack>
            {view === 'chunking' && <Chunking />}
            {view === 'evaluation' && <Evaluation />}
        </MainCard>
    )
}

export default Playground
