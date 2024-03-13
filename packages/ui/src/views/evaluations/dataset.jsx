import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

// material-ui
import {
    Box,
    Stack,
    Toolbar,
    TextField,
    InputAdornment,
    ButtonGroup,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton,
    Button
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import { StyledButton } from '@/ui-component/button/StyledButton'
import * as React from 'react'

// API
import useNotifier from '@/utils/useNotifier'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'
import useConfirm from '@/hooks/useConfirm'
import useApi from '@/hooks/useApi'
import datasetsApi from '@/api/dataset'
import moment from 'moment/moment'

// Hooks

// icons
import VariablesEmptySVG from '@/assets/images/variables_empty.svg'
import { IconTrash, IconEdit, IconPlus, IconSearch, IconTable, IconX } from '@tabler/icons'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import AddEditDatasetDialog from './AddEditDatasetDialog'
import { useNavigate } from 'react-router-dom'

// ==============================|| Datasets ||============================== //

const EvalDatasets = () => {
    const navigate = useNavigate()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const [view, setView] = React.useState(localStorage.getItem('datasetDisplayStyle') || 'card')
    const [search, setSearch] = useState('')
    const dispatch = useDispatch()
    useNotifier()

    const [showDatasetDialog, setShowDatasetDialog] = useState(false)
    const [datasetDialogProps, setDatasetDialogProps] = useState({})

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [datasets, setDatasets] = useState([])

    const { confirm } = useConfirm()

    const getAllDatasets = useApi(datasetsApi.getAllDatasets)

    const handleChange = (event, nextView) => {
        localStorage.setItem('datasetDisplayStyle', nextView)
        setView(nextView)
    }

    const goToRows = (selectedDataset) => {
        navigate(`/dataset_rows/${selectedDataset.id}`)
    }

    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    const addNew = () => {
        const dialogProp = {
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add',
            data: {}
        }
        setDatasetDialogProps(dialogProp)
        setShowDatasetDialog(true)
    }

    const edit = (dataset) => {
        const dialogProp = {
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Save',
            data: dataset
        }
        setDatasetDialogProps(dialogProp)
        setShowDatasetDialog(true)
    }

    const deleteDataset = async (dataset) => {
        const confirmPayload = {
            title: `Delete`,
            description: `Delete dataset ${dataset.name}?`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const deleteResp = await datasetsApi.deleteDataset(dataset.id)
                if (deleteResp.data) {
                    enqueueSnackbar({
                        message: 'Dataset deleted',
                        options: {
                            key: new Date().getTime() + Math.random(),
                            variant: 'success',
                            action: (key) => (
                                <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                    <IconX />
                                </Button>
                            )
                        }
                    })
                    onConfirm()
                }
            } catch (error) {
                const errorData = error.response?.data || `${error.response?.status}: ${error.response?.statusText}`
                enqueueSnackbar({
                    message: `Failed to delete dataset: ${errorData}`,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: true,
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
        }
    }

    const onConfirm = () => {
        setShowDatasetDialog(false)
        getAllDatasets.request()
    }

    function filterDatasets(data) {
        return data.name.toLowerCase().indexOf(search.toLowerCase()) > -1
    }

    useEffect(() => {
        getAllDatasets.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllDatasets.data) {
            setDatasets(getAllDatasets.data)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAllDatasets.data])

    return (
        <>
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
                            <h1>Datasets</h1>
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
                            <ButtonGroup
                                sx={{ maxHeight: 40 }}
                                disableElevation
                                variant='contained'
                                aria-label='outlined primary button group'
                            >
                                {/*<ButtonGroup disableElevation variant='contained' aria-label='outlined primary button group'>*/}
                                {/*    <ToggleButtonGroup*/}
                                {/*        sx={{ maxHeight: 40 }}*/}
                                {/*        value={view}*/}
                                {/*        color='primary'*/}
                                {/*        exclusive*/}
                                {/*        onChange={handleChange}*/}
                                {/*    >*/}
                                {/*        <ToggleButton*/}
                                {/*            sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}*/}
                                {/*            variant='contained'*/}
                                {/*            value='card'*/}
                                {/*            title='Card View'*/}
                                {/*        >*/}
                                {/*            <IconLayoutGrid />*/}
                                {/*        </ToggleButton>*/}
                                {/*        <ToggleButton*/}
                                {/*            sx={{ color: theme?.customization?.isDarkMode ? 'white' : 'inherit' }}*/}
                                {/*            variant='contained'*/}
                                {/*            value='list'*/}
                                {/*            title='List View'*/}
                                {/*        >*/}
                                {/*            <IconList />*/}
                                {/*        </ToggleButton>*/}
                                {/*    </ToggleButtonGroup>*/}
                                {/*</ButtonGroup>*/}
                                {/*<Box sx={{ width: 5 }} />*/}
                                <ButtonGroup disableElevation aria-label='outlined primary button group'>
                                    <StyledButton variant='contained' onClick={addNew} startIcon={<IconPlus />}>
                                        Add New
                                    </StyledButton>
                                </ButtonGroup>
                            </ButtonGroup>
                        </Toolbar>
                    </Box>
                </Stack>
                {datasets.length === 0 && (
                    <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                        <Box sx={{ p: 2, height: 'auto' }}>
                            <img
                                style={{ objectFit: 'cover', height: '30vh', width: 'auto' }}
                                src={VariablesEmptySVG}
                                alt='VariablesEmptySVG'
                            />
                        </Box>
                        <div>No Datasets Yet</div>
                    </Stack>
                )}
                {datasets.length > 0 && (
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Rows</TableCell>
                                    <TableCell>Last Updated</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell> </TableCell>
                                    <TableCell> </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {datasets.filter(filterDatasets).map((ds, index) => (
                                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell component='th' scope='row'>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 25,
                                                        height: 25,
                                                        marginRight: 10,
                                                        borderRadius: '50%'
                                                    }}
                                                >
                                                    <IconTable
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            borderRadius: '50%',
                                                            objectFit: 'contain'
                                                        }}
                                                    />
                                                </div>
                                                <Button onClick={() => goToRows(ds)} sx={{ textAlign: 'left' }}>
                                                    {ds.name}
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>{ds?.rowCount}</TableCell>
                                        <TableCell>{moment(ds.updatedDate).format('DD-MMM-YY')}</TableCell>
                                        <TableCell>{moment(ds.createdDate).format('DD-MMM-YY')}</TableCell>
                                        <TableCell>
                                            <IconButton title='Edit' color='primary' onClick={() => edit(ds)}>
                                                <IconEdit />
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>
                                            <IconButton title='Delete' color='error' onClick={() => deleteDataset(ds)}>
                                                <IconTrash />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </MainCard>
            <AddEditDatasetDialog
                show={showDatasetDialog}
                dialogProps={datasetDialogProps}
                onCancel={() => setShowDatasetDialog(false)}
                onConfirm={onConfirm}
            ></AddEditDatasetDialog>
            <ConfirmDialog />
        </>
    )
}

export default EvalDatasets
