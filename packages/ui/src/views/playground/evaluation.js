import { useEffect, useState } from 'react'
import axios from 'axios'

// material-ui
import {
    Box,
    Button,
    FormControl,
    IconButton,
    InputAdornment,
    List,
    OutlinedInput,
    Paper,
    Stack,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'
import { Dropdown } from '../../ui-component/dropdown/Dropdown'

// API
import chatflowsApi from 'api/chatflows'
import useApi from '../../hooks/useApi'
import { IconPlus, IconTrash } from '@tabler/icons'

// const
import { baseURL } from 'store/constant'
import TableCell from '@mui/material/TableCell'
import { BackdropLoader } from 'ui-component/loading/BackdropLoader'

const Evaluation = () => {
    const getAllChatflowsApi = useApi(chatflowsApi.getAllChatflows)
    const [chatflow1, setChatflow1] = useState('')
    const [chatflow2, setChatflow2] = useState('')
    const [flows, setFlows] = useState([])
    const [showResults, setShowResults] = useState(false)
    const [loading, setLoading] = useState(false)

    const [inputFields, setInputFields] = useState([{ prompt: '', chatflow1: '', chatflow2: '' }])
    useEffect(() => {
        if (flows.length === 0) {
            getAllChatflowsApi.request()
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

    const addInputField = () => {
        setInputFields([...inputFields, { prompt: '', chatflow1: '', chatflow2: '' }])
    }
    const reset = () => {
        setChatflow1('')
        setChatflow2('')
        setInputFields([{ prompt: '', chatflow1: '', chatflow2: '' }])
        setShowResults(false)
    }

    const evaluate = async () => {
        setLoading(true)
        let updatedFields = await fetchPredictions()
        setInputFields(updatedFields)
        setShowResults(true)
        setLoading(false)
    }
    const fetchPredictions = async () => {
        const dataFields = [...inputFields]
        try {
            const promises = []
            dataFields.map(async (data, index) => {
                let startTime = performance.now()
                let response1 = axios
                    .post(`${baseURL}/api/v1/prediction/${chatflow1}`, { question: data.prompt })
                    .then(async function (response) {
                        const endTime = performance.now()
                        data.chatflow1time = (endTime - startTime).toFixed(2) + ' ms'
                        data.chatflow1 = response.data.text
                        inputFields[index].chatflow1 = response.data.text
                        return response.data
                    })
                    .catch(function (error) {
                        console.error(error)
                    })
                startTime = performance.now()
                let response2 = axios
                    .post(`${baseURL}/api/v1/prediction/${chatflow2}`, { question: data.prompt })
                    .then(async function (response) {
                        const endTime = performance.now()
                        data.chatflow2time = (endTime - startTime).toFixed(2) + ' ms'
                        data.chatflow2 = response.data.text
                        inputFields[index].chatflow2 = response.data.text
                        return response.data
                    })
                    .catch(function (error) {
                        data.chatflow2 = JSON.stringify(error)
                        inputFields[index].chatflow2 = JSON.stringify(error)
                        console.error(error)
                    })
                promises.push(response1)
                promises.push(response2)
            })
            await Promise.all(promises)
        } catch (e) {
            console.error(e)
        }
        return dataFields
    }
    const removeInputFields = (index) => {
        const rows = [...inputFields]
        rows.splice(index, 1)
        setInputFields(rows)
    }

    const handleChange = (index, evnt) => {
        const { name, value } = evnt.target
        const list = [...inputFields]
        list[index][name] = value
        setInputFields(list)
    }

    return (
        <div>
            {!showResults && (
                <>
                    <Box sx={{ p: 1 }}>
                        <Typography variant='h4' color='text.secondary'>
                            Select upto 2 chatflows to evaluate
                        </Typography>
                    </Box>
                    <Box sx={{ p: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 1, alignItems: 'center' }}>
                            <FormControl sx={{ mr: 1, width: '50%' }}>
                                <Stack sx={{ position: 'relative' }} direction='row'>
                                    <Typography variant='overline'>
                                        Chatflow 1<span style={{ color: 'red' }}>&nbsp;*</span>
                                    </Typography>
                                </Stack>
                                <Dropdown
                                    name='chatflow1'
                                    defaultOption='Select Chatflow'
                                    options={flows}
                                    onSelect={(newValue) => setChatflow1(newValue)}
                                    value={chatflow1}
                                />
                            </FormControl>
                            <FormControl sx={{ mr: 1, width: '50%' }}>
                                <Stack sx={{ position: 'relative' }} direction='row'>
                                    <Typography variant='overline'>
                                        Chatflow 2<span style={{ color: 'red' }}>&nbsp;*</span>
                                    </Typography>
                                </Stack>
                                <Dropdown
                                    name={chatflow2}
                                    options={flows}
                                    defaultOption='Select Chatflow'
                                    onSelect={(newValue) => setChatflow2(newValue)}
                                    value={chatflow2}
                                />
                            </FormControl>
                        </Box>
                    </Box>
                    <Box sx={{ p: 1 }}>
                        <List>
                            {inputFields.map((data, index) => {
                                return (
                                    <>
                                        <div key={index} style={{ display: 'flex', width: '100%' }}>
                                            <Box sx={{ width: '85%', mb: 1 }}>
                                                <OutlinedInput
                                                    sx={{ width: '100%' }}
                                                    key={index}
                                                    type='text'
                                                    onChange={(e) => handleChange(index, e)}
                                                    multiline={true}
                                                    rows='3'
                                                    value={data.prompt}
                                                    name='prompt'
                                                    endAdornment={
                                                        <InputAdornment position='end' sx={{ padding: '2px' }}>
                                                            {inputFields.length > 1 && (
                                                                <IconButton
                                                                    sx={{ height: 30, width: 30 }}
                                                                    size='small'
                                                                    color='error'
                                                                    disabled={inputFields.length === 1}
                                                                    onClick={() => removeInputFields(index)}
                                                                    edge='end'
                                                                >
                                                                    <IconTrash />
                                                                </IconButton>
                                                            )}
                                                        </InputAdornment>
                                                    }
                                                />
                                            </Box>
                                            <Box sx={{ width: '5%', mb: 1, verticalAlign: 'center' }}>
                                                {index === inputFields.length - 1 && (
                                                    <IconButton color='primary' onClick={addInputField}>
                                                        <IconPlus />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </div>
                                    </>
                                )
                            })}
                        </List>
                    </Box>
                </>
            )}
            {showResults && (
                <TableContainer component={Paper}>
                    <Table aria-label='prediction table'>
                        <TableHead>
                            <TableRow>
                                <TableCell>Input</TableCell>
                                <TableCell sx={{ maxWidth: '40%' }} align='left'>
                                    {flows.find((f) => f.name === chatflow1).label}
                                </TableCell>
                                <TableCell sx={{ maxWidth: '40%' }} align='left'>
                                    {flows.find((f) => f.name === chatflow2).label}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {inputFields.map((row) => (
                                <>
                                    <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell component='th' scope='row' sx={{ maxWidth: '20%' }}>
                                            {row.prompt}
                                        </TableCell>
                                        <TableCell
                                            style={{
                                                whiteSpace: 'normal',
                                                wordWrap: 'break-word',
                                                maxWidth: '40%'
                                            }}
                                            align='left'
                                        >
                                            {row.chatflow1}
                                            <Typography sx={{ display: 'flex' }} variant='caption' component='subtitle2'>
                                                {row.chatflow1time}
                                            </Typography>
                                        </TableCell>
                                        <TableCell
                                            style={{
                                                whiteSpace: 'normal',
                                                wordWrap: 'break-word',
                                                maxWidth: '40%'
                                            }}
                                            align='left'
                                        >
                                            {row.chatflow2}
                                            <Typography sx={{ display: 'flex' }} variant='caption' component='subtitle2'>
                                                {row.chatflow2time}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {loading && <BackdropLoader open={loading} />}
            <Box sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 1, textAlign: 'center' }}>
                    <Box sx={{ width: '100%', mb: 1 }}>
                        <Button variant='contained' color='error' sx={{ mr: 5 }} onClick={reset}>
                            Reset
                        </Button>
                        {!showResults && (
                            <Button variant='contained' color='primary' disabled={!chatflow1 || !chatflow2} onClick={evaluate}>
                                Evaluate
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>
        </div>
    )
}

export default Evaluation
