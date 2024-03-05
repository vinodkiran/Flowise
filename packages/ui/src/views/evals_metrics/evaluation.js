import { useEffect, useState } from 'react'
import axios from 'axios'

// material-ui
import { Box, IconButton, Paper, Table, TableBody, TableContainer, TableHead, TableRow, Toolbar } from '@mui/material'

// API
import datasetsApi from 'api/dataset'

// const
import TableCell from '@mui/material/TableCell'
import MainCard from '../../ui-component/cards/MainCard'
import { useTheme } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons'
import { StyledButton } from '../../ui-component/button/StyledButton'
import CreateEvaluationDialog from './CreateEvaluationDialog'
import { BackdropLoader } from 'ui-component/loading/BackdropLoader'
import useApi from '../../hooks/useApi'
import { baseURL } from '../../store/constant'

const EvalsEvaluation = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const getDatasetRows = useApi(datasetsApi.getDatasetRows)
    const [showNewEvaluationDialog, setShowNewEvaluationDialog] = useState(false)
    const [dialogProps, setDialogProps] = useState({})
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [chatflow, setChatflow] = useState('')
    const [dataset, setDataset] = useState('')
    const [evaluationType, setEvaluationType] = useState('')

    useEffect(() => {
        if (rows.length === 0) {
            setRows([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onConfirm = (evaluationData) => {
        setShowNewEvaluationDialog(false)
        setChatflow(evaluationData.chatflow)
        setDataset(evaluationData.dataset)
        setEvaluationType(evaluationData.evaluationType)
        //getDatasetRows.request(evaluationData.dataset)
        setLoading(true)
        const saveEvaluationData = {
            chatflowId: chatflow,
            datasetId: dataset,
            evaluationType: evaluationType
        }
        console.log(saveEvaluationData)
        setLoading(false)
    }

    const createEvaluation = () => {
        const dialogProp = {
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Start New Evaluation',
            data: {}
        }
        setDialogProps(dialogProp)
        setShowNewEvaluationDialog(true)
    }

    // useEffect(() => {
    //     if (getDatasetRows.data) {
    //         evaluate()
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [getDatasetRows.data])

    const evaluate = async () => {
        setLoading(true)
        let responseData = await fetchPredictions(getDatasetRows.data.rows)
        const saveEvaluationData = {
            chatflowId: chatflow,
            datasetId: dataset,
            evaluationType: evaluationType,
            rows: responseData.map((row) => {
                return {
                    input: row.input,
                    output: row.output,
                    prediction: row.prediction,
                    time: row.time
                }
            })
        }
        console.log(saveEvaluationData)
        setLoading(false)
    }

    const fetchPredictions = async (inputFields) => {
        const dataFields = [...inputFields]
        try {
            const promises = []
            dataFields.map(async (data, index) => {
                let startTime = performance.now()
                let response1 = axios
                    .post(`${baseURL}/api/v1/prediction/${chatflow}`, { question: data.input })
                    .then(async function (response) {
                        const endTime = performance.now()
                        data.time = (endTime - startTime).toFixed(2) + ' ms'
                        inputFields[index].prediction = response.data.text
                        inputFields[index].time = data.time
                        return response.data
                    })
                    .catch(function (error) {
                        console.error(error)
                    })
                promises.push(response1)
            })
            await Promise.all(promises)
        } catch (e) {
            console.error(e)
        }
        return dataFields
    }

    return (
        <div>
            <MainCard sx={{ background: customization.isDarkMode ? theme.palette.common.black : '' }}>
                <>
                    <Box sx={{ flexGrow: 1 }}>
                        <Toolbar
                            disableGutters={true}
                            style={{
                                margin: 1,
                                padding: 1,
                                paddingBottom: 2,
                                display: 'flex',
                                justifyContent: 'space-between',
                                width: '100%'
                            }}
                        >
                            <h1 style={{ marginRight: '18px' }}>Evaluation</h1>
                            <StyledButton
                                variant='contained'
                                sx={{ maxHeight: 40 }}
                                style={{ marginLeft: '18px' }}
                                onClick={createEvaluation}
                                startIcon={<IconPlus />}
                            >
                                New Evaluation
                            </StyledButton>
                        </Toolbar>
                    </Box>
                    <TableContainer component={Paper}>
                        <Table aria-label='simple table'>
                            <TableHead>
                                <TableRow>
                                    <TableCell width='30%'>Chatflow</TableCell>
                                    <TableCell width='20%'>Dataset</TableCell>
                                    <TableCell width='15%'>Type</TableCell>
                                    <TableCell width='15%'>Date</TableCell>
                                    <TableCell width='20%' colSpan='2'>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.length === 0 && (
                                    <TableRow sx={{ border: 1 }}>
                                        <TableCell colSpan='6'>
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
                                                <IconButton title='Edit' color='primary'>
                                                    <IconEdit />
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton title='Delete' color='error'>
                                                    <IconTrash />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            </MainCard>
            <CreateEvaluationDialog
                show={showNewEvaluationDialog}
                dialogProps={dialogProps}
                onCancel={() => setShowNewEvaluationDialog(false)}
                onConfirm={onConfirm}
            ></CreateEvaluationDialog>
            {loading && <BackdropLoader open={loading} />}
        </div>
    )
}

export default EvalsEvaluation
