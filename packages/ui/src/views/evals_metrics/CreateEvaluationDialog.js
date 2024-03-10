import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

// Material
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Box,
    Typography,
    Stack,
    RadioGroup,
    TableContainer,
    Paper,
    Table,
    TableRow,
    TableBody,
    FormControlLabel,
    Radio,
    Chip,
    OutlinedInput,
    Grid
} from '@mui/material'

// Project imports
import { StyledButton } from 'ui-component/button/StyledButton'
import ConfirmDialog from 'ui-component/dialog/ConfirmDialog'

// Icons
import { IconTestPipe2 } from '@tabler/icons'

// API
import chatflowsApi from 'api/chatflows'
import useApi from '../../hooks/useApi'
import datasetsApi from 'api/dataset'

// Hooks

// utils
import useNotifier from 'utils/useNotifier'
import { Dropdown } from '../../ui-component/dropdown/Dropdown'
import TableCell from '@mui/material/TableCell'
import CredentialInputHandler from '../canvas/CredentialInputHandler'
import { TooltipWithParser } from '../../ui-component/tooltip/TooltipWithParser'

// const

const CreateEvaluationDialog = ({ show, dialogProps, onCancel, onConfirm }) => {
    const portalElement = document.getElementById('portal')

    const dispatch = useDispatch()

    // ==============================|| Snackbar ||============================== //

    useNotifier()

    const createNewEvaluation = async () => {
        const chatflowName = flows.find((f) => f.name === chatflow)?.label
        const datasetName = datasets.find((f) => f.name === dataset)?.label

        onConfirm({
            name: evaluationName,
            evaluationType: evaluationType,
            credentialId: credentialId,
            chatflowId: chatflow,
            chatflowName: chatflowName,
            datasetId: dataset,
            datasetName: datasetName
        })
    }

    const getAllChatflowsApi = useApi(chatflowsApi.getAllChatflows)
    const getAllDatasets = useApi(datasetsApi.getAllDatasets)

    const [chatflow, setChatflow] = useState('')
    const [chatflow2, setChatflow2] = useState('')
    const [dataset, setDataset] = useState('')

    const [flows, setFlows] = useState([])
    const [datasets, setDatasets] = useState([])
    const [credentialId, setCredentialId] = useState('')
    const [evaluationType, setEvaluationType] = useState('simple')
    const [evaluationName, setEvaluationName] = useState('')

    useEffect(() => {
        if (flows.length === 0) {
            getAllChatflowsApi.request()
        }
        if (datasets.length === 0) {
            getAllDatasets.request()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllChatflowsApi.data) {
            try {
                const chatflows = getAllChatflowsApi.data
                let flowNames = []
                for (let i = 0; i < chatflows.length; i += 1) {
                    const flow = chatflows[i]
                    flowNames.push({
                        label: flow.name,
                        name: flow.id
                    })
                }
                setFlows(flowNames)
            } catch (e) {
                console.error(e)
            }
        }
    }, [getAllChatflowsApi.data])

    useEffect(() => {
        if (getAllDatasets.data) {
            try {
                const datasets = getAllDatasets.data
                let dsNames = []
                for (let i = 0; i < datasets.length; i += 1) {
                    const ds = datasets[i]
                    dsNames.push({
                        label: ds.name,
                        name: ds.id
                    })
                }
                setDatasets(dsNames)
            } catch (e) {
                console.error(e)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAllDatasets.data])

    const onEvaluationTypeChange = (event) => {
        setEvaluationType(event.target.value)
    }

    const component = show ? (
        <Dialog
            fullWidth
            maxWidth='lg'
            open={show}
            onClose={onCancel}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
        >
            <DialogTitle sx={{ fontSize: '1rem' }} id='alert-dialog-title'>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <div
                        style={{
                            width: 50,
                            height: 50,
                            marginRight: 10,
                            borderRadius: '50%',
                            backgroundColor: 'white'
                        }}
                    >
                        <IconTestPipe2
                            style={{
                                width: '100%',
                                height: '100%',
                                padding: 7,
                                borderRadius: '50%',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                    {'Start New Evaluation'}
                </div>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing='5'>
                    <Grid item xs={12} sm={12} md={2} lg={2}>
                        <Stack sx={{ position: 'relative' }} direction='row'>
                            <Typography variant='overline'>Name</Typography>
                            <TooltipWithParser style={{ marginLeft: 10 }} title={'Friendly name to tag this run.'} />
                        </Stack>
                        <OutlinedInput
                            id='evaluationName'
                            type='string'
                            size='small'
                            fullWidth
                            value={evaluationName}
                            name='evaluationName'
                            onChange={(e) => setEvaluationName(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={5} lg={5}>
                        <Typography variant='overline'>Chatflow to Evaluate</Typography>
                        <Dropdown
                            name='chatflow1'
                            defaultOption='Select Chatflow'
                            options={flows}
                            onSelect={(newValue) => setChatflow(newValue)}
                            value={chatflow}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={5} lg={5}>
                        <Typography variant='overline'>Dataset to use</Typography>
                        <Dropdown
                            name='dataset'
                            defaultOption='Select Dataset'
                            options={datasets}
                            onSelect={(newValue) => setDataset(newValue)}
                            value={dataset}
                        />
                    </Grid>
                </Grid>

                <RadioGroup
                    onChange={onEvaluationTypeChange}
                    name='evaluationType'
                    value={evaluationType}
                    aria-labelledby='eval-optins-radio-buttons-group'
                    defaultValue='simple'
                >
                    <Box sx={{ flexGrow: 1, mt: 0 }}>
                        <TableContainer component={Paper}>
                            <Table aria-label='simple table'>
                                {/*<TableHead>*/}
                                {/*    <TableRow>*/}
                                {/*        <TableCell width={'20%'}>{'Type'}</TableCell>*/}
                                {/*        <TableCell width={'80%'}>{'Description'}</TableCell>*/}
                                {/*    </TableRow>*/}
                                {/*</TableHead>*/}
                                <TableBody>
                                    <TableRow style={{ verticalAlign: 'top' }}>
                                        <TableCell>
                                            <FormControlLabel value='simple' control={<Radio />} label='Simple' />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant='h4'>Simple evaluation based on the dataset</Typography>
                                            <Typography variant='body2'>
                                                Uses the <span style={{ fontStyle: 'italic' }}>input</span> column from the dataset and
                                                executes the selected Chatflow, and compares the results with the output column.
                                            </Typography>
                                            <Chip variant='outlined' color='primary' style={{ margin: 5 }} label={'latency'} />{' '}
                                            <Chip color='primary' variant='outlined' label={'token count'} />{' '}
                                            <Chip color='primary' variant='outlined' label={'cost'} />{' '}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow style={{ verticalAlign: 'top' }}>
                                        <TableCell>
                                            <FormControlLabel value='llm' control={<Radio />} label='LLM Based' />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant='h4'>Evaluation using LLM</Typography>
                                            <Typography variant='body2'>
                                                Uses the <span style={{ fontStyle: 'italic' }}>input</span> column from the dataset and
                                                executes the selected Chatflow, evaluating the results with the
                                                <span style={{ fontStyle: 'italic' }}> output</span> column by invoking an LLM. Currently,
                                                only <span style={{ fontWeight: 'bold' }}>OpenAI</span> LLM is supported.
                                                <br />
                                                <span style={{ fontWeight: 'bold' }}> Select the credential to use.</span>
                                            </Typography>
                                            <Box>
                                                <CredentialInputHandler
                                                    disabled={evaluationType !== 'llm'}
                                                    size='small'
                                                    sx={{ flexGrow: 1, marginBottom: 3 }}
                                                    key={credentialId}
                                                    data={credentialId ? { credential: credentialId } : {}}
                                                    inputParam={{
                                                        label: 'Connect Credential',
                                                        name: 'credential',
                                                        type: 'credential',
                                                        credentialNames: ['openAIApi']
                                                    }}
                                                    onSelect={(newValue) => {
                                                        setCredentialId(newValue)
                                                    }}
                                                />
                                            </Box>
                                            <Chip variant='outlined' color='primary' style={{ margin: 5 }} label={'latency'} />{' '}
                                            <Chip variant='outlined' color='primary' label={'token count'} />{' '}
                                            <Chip variant='outlined' color='primary' label={'cost'} />{' '}
                                            <Chip variant='outlined' color='error' label={'correctness'} />{' '}
                                            <Chip variant='outlined' color='error' label={'relevancy'} />
                                        </TableCell>
                                    </TableRow>
                                    <TableRow style={{ verticalAlign: 'top' }}>
                                        <TableCell>
                                            <FormControlLabel value='comparative' control={<Radio />} label='Compare 2 Flows - LLM Based' />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant='h4'>Compare Responses from 2 Chatflows using an LLM</Typography>
                                            <Typography variant='body2'>
                                                Executes both chatflows using the dataset inputs, and compares the answers by using an LLM.
                                                Used to generate comparative scores.Currently, only
                                                <span style={{ fontWeight: 'bold' }}> OpenAI</span> LLM is supported.
                                                <br />
                                                <span style={{ fontWeight: 'bold' }}>Select the credential to use.</span>
                                            </Typography>
                                            <Box>
                                                <CredentialInputHandler
                                                    disabled={evaluationType !== 'comparative'}
                                                    size='small'
                                                    sx={{ flexGrow: 1, marginBottom: 3 }}
                                                    key={credentialId}
                                                    data={credentialId ? { credential: credentialId } : {}}
                                                    inputParam={{
                                                        label: 'Connect Credential',
                                                        name: 'credential',
                                                        type: 'credential',
                                                        credentialNames: ['openAIApi']
                                                    }}
                                                    onSelect={(newValue) => {
                                                        setCredentialId(newValue)
                                                    }}
                                                />
                                            </Box>
                                            <Box>
                                                <span style={{ fontWeight: 'bold' }}> Select the second Chatflow.</span>
                                                <Dropdown
                                                    disabled={evaluationType !== 'comparative'}
                                                    name='chatflow2'
                                                    defaultOption='Select Chatflow'
                                                    options={flows}
                                                    onSelect={(newValue) => setChatflow2(newValue)}
                                                    value={chatflow2}
                                                />
                                            </Box>
                                            <Chip variant='outlined' color='primary' style={{ margin: 5 }} label={'latency'} />{' '}
                                            <Chip variant='outlined' color='primary' label={'token count'} />{' '}
                                            <Chip variant='outlined' color='primary' label={'cost'} />{' '}
                                            <Chip variant='outlined' color='error' label={'comparative score'} />
                                            <Chip variant='outlined' color='error' label={'reasoning'} />{' '}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </RadioGroup>
            </DialogContent>
            <DialogActions>
                <StyledButton variant='contained' onClick={() => createNewEvaluation()}>
                    {dialogProps.confirmButtonName}
                </StyledButton>
            </DialogActions>
            <ConfirmDialog />
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

CreateEvaluationDialog.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func
}

export default CreateEvaluationDialog
