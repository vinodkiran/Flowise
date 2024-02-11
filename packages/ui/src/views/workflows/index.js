import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

// material-ui
import { Grid, Box, Stack, Toolbar, ToggleButton, ButtonGroup, InputAdornment, TextField } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from 'ui-component/cards/MainCard'
import WorkflowItemCard from '../../ui-component/cards/WorkflowItemCard'
import { gridSpacing } from 'store/constant'
import WorkflowEmptySVG from 'assets/images/workflow_empty.svg'
import LoginDialog from 'ui-component/dialog/LoginDialog'
import ConfirmDialog from 'ui-component/dialog/ConfirmDialog'

// API
import workflowsApi from 'api/workflows'

// Hooks
import useApi from 'hooks/useApi'

// const
import { baseURL } from 'store/constant'

// icons
import { IconPlus, IconSearch, IconLayoutGrid, IconList } from '@tabler/icons'
import * as React from 'react'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { StyledButton } from '../../ui-component/button/StyledButton'

// ==============================|| WORKFLOWS ||============================== //

const Workflows = () => {
    const navigate = useNavigate()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const [isLoading, setLoading] = useState(true)
    const [images, setImages] = useState({})
    const [search, setSearch] = useState('')
    const [loginDialogOpen, setLoginDialogOpen] = useState(false)
    const [loginDialogProps, setLoginDialogProps] = useState({})

    const getAllWorkflowsApi = useApi(workflowsApi.getAllWorkflows)
    const [view, setView] = React.useState(localStorage.getItem('workflowDisplayStyle') || 'card')

    const handleChange = (event, nextView) => {
        localStorage.setItem('workflowDisplayStyle', nextView)
        setView(nextView)
    }

    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    function filterFlows(data) {
        return data.name.toLowerCase().indexOf(search.toLowerCase()) > -1
    }

    const onLoginClick = (username, password) => {
        localStorage.setItem('username', username)
        localStorage.setItem('password', password)
        navigate(0)
    }

    const addNew = () => {
        navigate('/workflow-designer')
    }

    const goToCanvas = (selectedChatflow) => {
        navigate(`/workflow-designer/${selectedChatflow.shortId}`)
    }

    useEffect(() => {
        getAllWorkflowsApi.request()

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllWorkflowsApi.error) {
            if (getAllWorkflowsApi.error?.response?.status === 401) {
                setLoginDialogProps({
                    title: 'Login',
                    confirmButtonName: 'Login'
                })
                setLoginDialogOpen(true)
            }
        }
    }, [getAllWorkflowsApi.error])

    useEffect(() => {
        setLoading(getAllWorkflowsApi.loading)
    }, [getAllWorkflowsApi.loading])

    useEffect(() => {
        if (getAllWorkflowsApi.data) {
            try {
                const workflows = getAllWorkflowsApi.data
                const images = {}
                for (let i = 0; i < workflows.length; i += 1) {
                    const flowDataStr = workflows[i].flowData
                    const flowData = JSON.parse(flowDataStr)
                    const nodes = flowData.nodes || []
                    images[workflows[i].id] = []
                    for (let j = 0; j < nodes.length; j += 1) {
                        const imageSrc = `${baseURL}/api/v1/node-icon/${nodes[j].data.name}`
                        if (!images[workflows[i].id].includes(imageSrc)) {
                            images[workflows[i].id].push(imageSrc)
                        }
                    }
                }
                setImages(images)
            } catch (e) {
                console.error(e)
            }
        }
    }, [getAllWorkflowsApi.data])

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
                        <h1>Workflows</h1>
                        <TextField
                            size='small'
                            sx={{ display: { xs: 'none', sm: 'block' }, ml: 3 }}
                            variant='outlined'
                            placeholder='Search name'
                            onChange={onSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <IconSearch />
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Box sx={{ flexGrow: 1 }} />
                        <ButtonGroup sx={{ maxHeight: 40 }} disableElevation variant='contained' aria-label='outlined primary button group'>
                            <ButtonGroup disableElevation variant='contained' aria-label='outlined primary button group'>
                                <ToggleButtonGroup sx={{ maxHeight: 40 }} value={view} color='primary' exclusive onChange={handleChange}>
                                    <ToggleButton
                                        sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}
                                        variant='contained'
                                        value='card'
                                        title='Card View'
                                    >
                                        <IconLayoutGrid />
                                    </ToggleButton>
                                    <ToggleButton
                                        sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}
                                        variant='contained'
                                        value='list'
                                        title='List View'
                                    >
                                        <IconList />
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </ButtonGroup>
                            <Box sx={{ width: 5 }} />
                            <ButtonGroup disableElevation aria-label='outlined primary button group'>
                                <StyledButton variant='contained' onClick={addNew} startIcon={<IconPlus />}>
                                    Add New
                                </StyledButton>
                            </ButtonGroup>
                        </ButtonGroup>
                    </Toolbar>
                </Box>
                {!isLoading && (!view || view === 'card') && getAllWorkflowsApi.data && (
                    <Grid container spacing={gridSpacing}>
                        {getAllWorkflowsApi.data.filter(filterFlows).map((data, index) => (
                            <Grid key={index} item lg={3} md={4} sm={6} xs={12}>
                                <WorkflowItemCard onClick={() => goToCanvas(data)} data={data} images={images[data.id]} />
                            </Grid>
                        ))}
                    </Grid>
                )}
                {/*{!isLoading && view === 'list' && getAllWorkflowsApi.data && (*/}
                {/*    // <FlowListTable*/}
                {/*    //     sx={{ mt: 20 }}*/}
                {/*    //     data={getAllChatflowsApi.data}*/}
                {/*    //     images={images}*/}
                {/*    //     filterFunction={filterFlows}*/}
                {/*    //     updateFlowsApi={getAllChatflowsApi}*/}
                {/*    // />*/}
                {/*)}*/}
            </Stack>

            {!isLoading && (!getAllWorkflowsApi.data || getAllWorkflowsApi.data.length === 0) && (
                <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                    <Box sx={{ p: 2, height: 'auto' }}>
                        <img style={{ objectFit: 'cover', height: '30vh', width: 'auto' }} src={WorkflowEmptySVG} alt='WorkflowEmptySVG' />
                    </Box>
                    <div>No Workflows Yet</div>
                </Stack>
            )}
            <LoginDialog show={loginDialogOpen} dialogProps={loginDialogProps} onConfirm={onLoginClick} />
            <ConfirmDialog />
        </MainCard>
    )
}

export default Workflows
