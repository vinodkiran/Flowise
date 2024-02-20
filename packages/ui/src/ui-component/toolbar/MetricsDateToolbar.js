import * as React from 'react'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import PropTypes from 'prop-types'
import { ButtonGroup, ToggleButton } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import { useSelector } from 'react-redux'

const toolbarItems = [
    {
        label: 'Yesterday',
        value: 'yesterday'
    },
    {
        label: 'Today',
        value: 'today'
    },
    {
        label: '7d',
        value: '7d'
    },
    {
        label: '15d',
        value: '15d'
    },
    {
        label: '30d',
        value: '30d'
    },
    {
        label: '60d',
        value: '60d'
    },
    {
        label: 'Custom',
        value: 'custom'
    }
]
export default function MetricsDateToolbar(initialState, toolbarType) {
    const theme = useTheme()
    const [view, setView] = React.useState(localStorage.getItem('metricsTimePeriod') || 'today')

    const handleChange = (event, nextView) => {
        localStorage.setItem('metricsTimePeriod', nextView)
        setView(nextView)
    }

    return (
        <ButtonGroup disableElevation variant='contained' aria-label='outlined primary button group'>
            <ToggleButtonGroup sx={{ maxHeight: 40 }} value={view} color='primary' exclusive onChange={handleChange}>
                {toolbarItems.map((item, index) => (
                    <ToggleButton
                        key={index}
                        sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}
                        variant='contained'
                        value={item.value}
                        title={item.label}
                    >
                        {item.label}
                    </ToggleButton>
                ))}
                {/*<ToggleButton*/}
                {/*    sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}*/}
                {/*    variant='contained'*/}
                {/*    value='card'*/}
                {/*    title='Card View'*/}
                {/*>*/}
                {/*    Yesterday*/}
                {/*</ToggleButton>*/}
                {/*<ToggleButton*/}
                {/*    sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}*/}
                {/*    variant='contained'*/}
                {/*    value='card'*/}
                {/*    title='Card View'*/}
                {/*>*/}
                {/*    Today*/}
                {/*</ToggleButton>*/}
                {/*<ToggleButton*/}
                {/*    sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}*/}
                {/*    variant='contained'*/}
                {/*    value='list'*/}
                {/*    title='List View'*/}
                {/*>*/}
                {/*    7d*/}
                {/*</ToggleButton>*/}
                {/*<ToggleButton*/}
                {/*    sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}*/}
                {/*    variant='contained'*/}
                {/*    value='list'*/}
                {/*    title='List View'*/}
                {/*>*/}
                {/*    15d*/}
                {/*</ToggleButton>*/}
                {/*<ToggleButton*/}
                {/*    sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}*/}
                {/*    variant='contained'*/}
                {/*    value='list'*/}
                {/*    title='List View'*/}
                {/*>*/}
                {/*    30d*/}
                {/*</ToggleButton>*/}
                {/*<ToggleButton*/}
                {/*    sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}*/}
                {/*    variant='contained'*/}
                {/*    value='list'*/}
                {/*    title='List View'*/}
                {/*>*/}
                {/*    60d*/}
                {/*</ToggleButton>*/}
                {/*<ToggleButton*/}
                {/*    sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}*/}
                {/*    variant='contained'*/}
                {/*    value='list'*/}
                {/*    title='List View'*/}
                {/*>*/}
                {/*    Custom*/}
                {/*</ToggleButton>*/}
            </ToggleButtonGroup>
        </ButtonGroup>
    )
}

MetricsDateToolbar.propTypes = {
    initialState: PropTypes.string,
    toolbarType: PropTypes.string
}
