import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

// material-ui
import {
    Grid,
    Box,
    Stack,
    ToggleButton,
    TableContainer, Paper, Table, TableHead, TableRow, TableBody, Skeleton, Chip,
} from "@mui/material";
import TableCell, { tableCellClasses } from '@mui/material/TableCell'

import { styled, useTheme } from "@mui/material/styles";

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import WorkflowItemCard from '@/ui-component/cards/WorkflowItemCard'
import { gridSpacing } from '@/store/constant'
import WorkflowEmptySVG from '@/assets/images/workflow_empty.svg'
import LoginDialog from '@/ui-component/dialog/LoginDialog'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'

// API
import workflowsApi from '@/api/workflows'

// Hooks
import useApi from '@/hooks/useApi'

// const
import { baseURL } from '@/store/constant'

// icons
import { IconPlus, IconSearch, IconLayoutGrid, IconList, IconVariable, IconEdit, IconTrash } from "@tabler/icons-react";
import * as React from 'react'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { StyledButton } from '@/ui-component/button/StyledButton'
import ErrorBoundary from "@/ErrorBoundary";
import ViewHeader from "@/layout/MainLayout/ViewHeader";
import moment from "moment/moment";

// ==============================|| WORKFLOWS ||============================== //
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderColor: theme.palette.grey[900] + 25,

    [`&.${tableCellClasses.head}`]: {
        color: theme.palette.grey[900]
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
        height: 64
    }
}))

const StyledTableRow = styled(TableRow)(() => ({
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0
    }
}))

const Workflows = () => {
    const navigate = useNavigate()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const [isLoading, setLoading] = useState(true)
    const [error, setError] = useState(null)
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

    const setChipColor = (execState) => {
        if (execState) return theme.palette.success.dark
        return theme.palette.warning.dark
    }

    const setChipBgColor = (execState) => {
        if (execState) return theme.palette.success.light
        return theme.palette.warning.light
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
      <>
          <MainCard>
              {error ? (
                <ErrorBoundary error={error} />
              ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader onSearchChange={onSearchChange} search={true} searchPlaceholder='Workflows' title='Workflows'>
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
                        <StyledButton
                          variant='contained'
                          sx={{ borderRadius: 2, height: '100%' }}
                          onClick={addNew}
                          startIcon={<IconPlus />}
                        >
                            New Workflow
                        </StyledButton>
                    </ViewHeader>
                    {!isLoading && (!view || view === 'card') && getAllWorkflowsApi.data && (
                      <Grid container spacing={gridSpacing}>
                          {getAllWorkflowsApi.data.filter(filterFlows).map((data, index) => (
                            <Grid key={index} item lg={3} md={4} sm={6} xs={12}>
                                <WorkflowItemCard onClick={() => goToCanvas(data)} data={data} images={images[data.id]} />
                            </Grid>
                          ))}
                      </Grid>
                    )}
                    {view === 'list' && (
                      <TableContainer
                        sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}
                        component={Paper}
                      >
                          <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                              <TableHead
                                sx={{
                                    backgroundColor: customization.isDarkMode
                                      ? theme.palette.common.black
                                      : theme.palette.grey[100],
                                    height: 56
                                }}
                              >
                                  <TableRow>
                                      <StyledTableCell>Short ID</StyledTableCell>
                                      <StyledTableCell>Name</StyledTableCell>
                                      <StyledTableCell>Deployed</StyledTableCell>
                                      <StyledTableCell>Execution Count</StyledTableCell>
                                      <StyledTableCell>Last Updated</StyledTableCell>
                                      <StyledTableCell>Created</StyledTableCell>
                                      <StyledTableCell> </StyledTableCell>
                                  </TableRow>
                              </TableHead>
                              <TableBody>
                                  {isLoading ? (
                                    <>
                                        <StyledTableRow>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                        </StyledTableRow>
                                        <StyledTableRow>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                        </StyledTableRow>
                                    </>
                                  ) : (
                                    <>
                                        {getAllWorkflowsApi.data && getAllWorkflowsApi.data.map((exec, index) => (
                                          <StyledTableRow key={index} hover onClick={() => goToCanvas(exec)} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                              <StyledTableCell component='th' scope='row'>
                                                  <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center'
                                                    }}
                                                  >
                                                      {exec.shortId}
                                                  </div>
                                              </StyledTableCell>
                                              <StyledTableCell>{exec.name}</StyledTableCell>
                                              <StyledTableCell>
                                                  <Chip
                                                    sx={{
                                                        color: setChipColor(exec.deployed),
                                                        backgroundColor: setChipBgColor(exec.deployed),
                                                        ml: 1
                                                    }}
                                                    label={exec.deployed? 'Yes': 'No'}
                                                  />
                                              </StyledTableCell>
                                              <StyledTableCell style={{ textAlign: 'center' }}>
                                                  {exec.executionCount}
                                              </StyledTableCell>
                                              <StyledTableCell>
                                                  {moment(exec.updatedDate).format('MMMM Do YYYY, h:mm:ss A z')}
                                              </StyledTableCell>
                                              <StyledTableCell>
                                                  {moment(exec.createdDate).format('MMMM Do YYYY, h:mm:ss A z')}
                                              </StyledTableCell>
                                              <StyledTableCell>
                                                  {/*<IconButton title='Delete' color='error' onClick={() => deleteExec(exec)}>*/}
                                                  {/*    <IconTrash />*/}
                                                  {/*</IconButton>*/}
                                              </StyledTableCell>
                                          </StyledTableRow>
                                        ))}
                                    </>
                                  )}
                              </TableBody>
                          </Table>
                      </TableContainer>
                    )}
                    {!isLoading && (!getAllWorkflowsApi.data || getAllWorkflowsApi.data.length === 0) && (
                      <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                          <Box sx={{ p: 2, height: 'auto' }}>
                              <img style={{ objectFit: 'cover', height: '30vh', width: 'auto' }} src={WorkflowEmptySVG} alt='WorkflowEmptySVG' />
                          </Box>
                          <div>No Workflows Yet</div>
                      </Stack>
                    )}
                </Stack>
              )}
          </MainCard>
          <ConfirmDialog />
      </>
    )
}

export default Workflows
