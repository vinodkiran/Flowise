import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

// material-ui
import {
    Box,
    Toolbar,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton,
    Button,
    Typography,
    Breadcrumbs,
    ButtonGroup
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from 'ui-component/cards/MainCard'
import { StyledButton } from '../../ui-component/button/StyledButton'

// API
import useNotifier from '../../utils/useNotifier'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '../../store/actions'
import useConfirm from '../../hooks/useConfirm'
import useApi from '../../hooks/useApi'
import datasetsApi from 'api/dataset'

// Hooks

// icons
import { IconTrash, IconEdit, IconPlus, IconX, IconUpload } from '@tabler/icons'
import ConfirmDialog from '../../ui-component/dialog/ConfirmDialog'
import AddEditDatasetRowDialog from './AddEditDatasetRowDialog'
import Link from '@mui/material/Link'

// ==============================|| Datasets ||============================== //

const EvalDatasets = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()
    useNotifier()

    const [showRowDialog, setShowRowDialog] = useState(false)
    const [rowDialogProps, setRowDialogProps] = useState({})
    const [rows, setRows] = useState([])
    const [selectedDatasetName, setSelectedDatasetName] = useState('')

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const { confirm } = useConfirm()

    const getDatasetRows = useApi(datasetsApi.getDatasetRows)

    const URLpath = document.location.pathname.toString().split('/')
    const datasetId = URLpath[URLpath.length - 1] === 'dataset_rows' ? '' : URLpath[URLpath.length - 1]

    const breadcrumbs = [
        <Link underline='hover' key='1' color='inherit'>
            {''}
        </Link>,
        <Link underline='hover' key='2' color='inherit' href='/dataset'>
            Datasets
        </Link>,
        <Typography key='3' color='text.primary'>
            {selectedDatasetName}
        </Typography>
    ]

    const addNew = () => {
        const dialogProp = {
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add',
            data: {
                datasetId: datasetId,
                datasetName: selectedDatasetName
            }
        }
        setRowDialogProps(dialogProp)
        setShowRowDialog(true)
    }

    const edit = (dataset) => {
        const dialogProp = {
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Save',
            data: {
                datasetName: selectedDatasetName,
                ...dataset
            }
        }
        setRowDialogProps(dialogProp)
        setShowRowDialog(true)
    }

    const deleteDatasetRow = async (dataset) => {
        const confirmPayload = {
            title: `Delete`,
            description: `Delete dataset row ?`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const deleteResp = await datasetsApi.deleteDatasetRow(dataset.id)
                if (deleteResp.data) {
                    enqueueSnackbar({
                        message: 'Dataset Row deleted',
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
                    message: `Failed to delete dataset row: ${errorData}`,
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
        setShowRowDialog(false)
        getDatasetRows.request(datasetId)
    }

    useEffect(() => {
        getDatasetRows.request(datasetId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getDatasetRows.data) {
            setSelectedDatasetName(getDatasetRows.data.name)
            setRows(getDatasetRows.data.rows)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getDatasetRows.data])

    return (
        <>
            <MainCard sx={{ background: customization.isDarkMode ? theme.palette.common.black : '' }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Breadcrumbs separator='›' aria-label='breadcrumb'>
                        {breadcrumbs}
                    </Breadcrumbs>
                </Box>
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
                        <h1 style={{ marginRight: '18px' }}>Dataset : {selectedDatasetName}</h1>
                        <ButtonGroup sx={{ maxHeight: 40 }} disableElevation variant='contained' aria-label='outlined primary button group'>
                            <Box sx={{ width: 5 }} />
                            <ButtonGroup disableElevation aria-label='outlined primary button group'>
                                <StyledButton
                                    variant='outlined'
                                    sx={{ maxHeight: 40 }}
                                    style={{ marginLeft: '18px' }}
                                    onClick={addNew}
                                    startIcon={<IconUpload />}
                                >
                                    Upload CSV
                                </StyledButton>
                                <StyledButton
                                    variant='contained'
                                    sx={{ maxHeight: 40 }}
                                    style={{ marginLeft: '18px' }}
                                    onClick={addNew}
                                    startIcon={<IconPlus />}
                                >
                                    New Item
                                </StyledButton>
                            </ButtonGroup>
                        </ButtonGroup>
                    </Toolbar>
                </Box>
                <TableContainer component={Paper}>
                    <Table aria-label='simple table'>
                        <TableHead>
                            <TableRow>
                                <TableCell width='40%'>Input</TableCell>
                                <TableCell width='40%'>Output</TableCell>
                                <TableCell width='20%' colSpan='2'>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length === 0 && (
                                <TableRow sx={{ border: 1 }}>
                                    <TableCell colSpan='4'>
                                        <div>No Items Yet</div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.length > 0 &&
                                rows.map((item, index) => (
                                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>{item.input}</TableCell>
                                        <TableCell>{item.output}</TableCell>
                                        <TableCell>
                                            <IconButton title='Edit' color='primary' onClick={() => edit(item)}>
                                                <IconEdit />
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>
                                            <IconButton title='Delete' color='error' onClick={() => deleteDatasetRow(item)}>
                                                <IconTrash />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </MainCard>
            <AddEditDatasetRowDialog
                show={showRowDialog}
                dialogProps={rowDialogProps}
                onCancel={() => setShowRowDialog(false)}
                onConfirm={onConfirm}
            ></AddEditDatasetRowDialog>
            <ConfirmDialog />
        </>
    )
}

export default EvalDatasets
