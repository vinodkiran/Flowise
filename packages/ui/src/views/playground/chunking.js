import { useEffect, useState } from 'react'

import playgroundApi from 'api/playground'

// material-ui
import { Box, Button, FormControl, OutlinedInput, Stack, Typography, Divider, Grid, Card, CardContent } from '@mui/material'
import { File } from '../../ui-component/file/File'
import { Dropdown } from '../../ui-component/dropdown/Dropdown'
import useApi from '../../hooks/useApi'
import TableContainer from '@mui/material/TableContainer'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'

const TextSplitter = [
    {
        label: 'Character Text Splitter',
        name: 'character-splitter'
    },
    {
        label: 'Recursive Text Splitter',
        name: 'recursive-splitter'
    },
    {
        label: 'Token Text Splitter',
        name: 'token-splitter'
    },
    {
        label: 'Code Text Splitter',
        name: 'code-splitter'
    },
    {
        label: 'Markdown Text Splitter',
        name: 'markdown-splitter'
    }
]

const Languages = [
    {
        label: 'cpp',
        name: 'cpp'
    },
    {
        label: 'go',
        name: 'go'
    },
    {
        label: 'java',
        name: 'java'
    },
    {
        label: 'js',
        name: 'js'
    },
    {
        label: 'php',
        name: 'php'
    },
    {
        label: 'proto',
        name: 'proto'
    },
    {
        label: 'python',
        name: 'python'
    },
    {
        label: 'rst',
        name: 'rst'
    },
    {
        label: 'ruby',
        name: 'ruby'
    },
    {
        label: 'rust',
        name: 'rust'
    },
    {
        label: 'scala',
        name: 'scala'
    },
    {
        label: 'swift',
        name: 'swift'
    },
    {
        label: 'markdown',
        name: 'markdown'
    },
    {
        label: 'latex',
        name: 'latex'
    },
    {
        label: 'html',
        name: 'html'
    },
    {
        label: 'sol',
        name: 'sol'
    }
]

const Chunking = () => {
    const [uploadFile, setUploadFile] = useState('')
    const [selectedTextSplitter, setSelectedTextSplitter] = useState('character-splitter')
    const [selectedLanguage, setSelectedLanguage] = useState('')
    const [chunkSize, setChunkSize] = useState(250)
    const [chunkOverlap, setChunkOverlap] = useState(50)
    const [noOfDocs, setNoOfDocs] = useState(10)
    const [customCharacters, setCustomCharacters] = useState('\n\n')
    const postFileAndGetSplits = useApi(playgroundApi.getSplits)
    const uploadAndSubmit = async (file) => {
        setUploadFile(file)
        await submit(file)
    }

    const submit = async (file) => {
        const body = {
            file: file ?? uploadFile,
            chunkSize: chunkSize,
            chunkOverlap: chunkOverlap,
            splitter: selectedTextSplitter,
            separator: customCharacters,
            codeLanguage: selectedLanguage,
            noOfDocs: noOfDocs
        }
        await postFileAndGetSplits.request(body)
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div>
            <Box sx={{ p: 1 }}>
                <Stack sx={{ position: 'relative' }} direction='row'>
                    <Typography variant='overline'>Upload File</Typography>
                </Stack>
                <File
                    key={uploadFile}
                    fileType='*'
                    onChange={(newValue) => uploadAndSubmit(newValue)}
                    value={uploadFile ?? 'Choose a file to upload'}
                />
            </Box>
            <Box sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', p: 2, pt: 1, alignItems: 'center' }}>
                    <FormControl sx={{ mr: 1, width: '20%' }}>
                        <Stack sx={{ position: 'relative' }} direction='row'>
                            <Typography variant='overline'>
                                Text Splitter
                                <span style={{ color: 'red' }}>&nbsp;*</span>
                            </Typography>
                        </Stack>
                        <Dropdown
                            name={selectedTextSplitter}
                            options={TextSplitter}
                            onSelect={(newValue) => setSelectedTextSplitter(newValue)}
                            value={selectedTextSplitter ?? 'choose an option'}
                        />
                    </FormControl>
                    <FormControl sx={{ mr: 1, width: '10%' }}>
                        <Stack sx={{ position: 'relative' }} direction='row'>
                            <Typography variant='overline'>
                                Code Language
                                <span style={{ color: 'red' }}>&nbsp;*</span>
                            </Typography>
                        </Stack>
                        <Dropdown
                            disabled={selectedTextSplitter !== 'code-splitter'}
                            name={selectedLanguage}
                            options={Languages}
                            onSelect={(newValue) => setSelectedLanguage(newValue)}
                            value={selectedLanguage ?? 'choose an option'}
                        />
                    </FormControl>
                    <FormControl sx={{ mr: 1, width: '15%' }}>
                        <Stack sx={{ position: 'relative' }} direction='row'>
                            <Typography variant='overline'>Custom Separators</Typography>
                        </Stack>
                        <OutlinedInput
                            value={customCharacters}
                            onChange={(newValue) => setCustomCharacters(newValue.target.value)}
                            placeholder='\n\n'
                            id='customCharacters'
                            size='small'
                            type='string'
                            fullWidth
                            name='customCharacters'
                        />
                    </FormControl>
                    <FormControl sx={{ mr: 1, width: '15%' }}>
                        <Stack sx={{ position: 'relative' }} direction='row'>
                            <Typography variant='overline'>
                                Chunk Size
                                <span style={{ color: 'red' }}>&nbsp;*</span>
                            </Typography>
                        </Stack>
                        <OutlinedInput
                            id='chunkSize'
                            value={chunkSize}
                            onChange={(newValue) => setChunkSize(parseInt(newValue.target.value))}
                            size='small'
                            type='number'
                            fullWidth
                            name='chunkSize'
                        />
                        {/*<Slider min={0} max={5000} defaultValue={100} valueLabel='on' valueLabelDisplay='on' name='chunkSizeSlider' />*/}
                    </FormControl>
                    <FormControl sx={{ mr: 1, width: '15%' }}>
                        <Stack sx={{ position: 'relative' }} direction='row'>
                            <Typography variant='overline'>
                                Chunk overlap
                                <span style={{ color: 'red' }}>&nbsp;*</span>
                            </Typography>
                        </Stack>
                        <OutlinedInput
                            id='chunkOverlap'
                            size='small'
                            type='number'
                            value={chunkOverlap}
                            onChange={(newValue) => setChunkOverlap(parseInt(newValue.target.value))}
                            fullWidth
                            name='chunkOverlap'
                        />
                        {/*<Stack sx={{ position: 'relative' }} direction='row'>*/}
                        {/*    <Slider*/}
                        {/*        min={0}*/}
                        {/*        max={5000}*/}
                        {/*        defaultValue={100}*/}
                        {/*        valueLabel='on'*/}
                        {/*        valueLabelDisplay='on'*/}
                        {/*        name='chunkOverlapSlider'*/}
                        {/*    />*/}
                        {/*</Stack>*/}
                    </FormControl>
                    <FormControl sx={{ mr: 1, width: '15%' }}>
                        <Stack sx={{ position: 'relative' }} direction='row'>
                            <Typography variant='overline'>
                                Docs to retrieve?
                                <span style={{ color: 'red' }}>&nbsp;*</span>
                            </Typography>
                        </Stack>
                        <OutlinedInput
                            id='noOfDocs'
                            value={noOfDocs}
                            onChange={(newValue) => setNoOfDocs(parseInt(newValue.target.value))}
                            size='small'
                            type='number'
                            fullWidth
                            name='chunkSize'
                        />
                        {/*<Slider min={0} max={5000} defaultValue={100} valueLabel='on' valueLabelDisplay='on' name='chunkSizeSlider' />*/}
                    </FormControl>
                    <FormControl sx={{ mr: 1, width: '10%' }}>
                        <Stack sx={{ position: 'relative' }} direction='row'>
                            <Typography variant='overline'>&nbsp;</Typography>
                        </Stack>
                        <Button disableElevation disabled={!uploadFile} variant='outlined' onClick={() => submit(null)}>
                            Fetch Splits
                        </Button>
                    </FormControl>
                </Box>
            </Box>
            <Box sx={{ p: 1 }}>
                <Divider />
            </Box>
            <Box sx={{ p: 1 }}>
                <Grid container spacing='4'>
                    <Grid item lg={4} md={4} sm={6} xs={12}>
                        <Card variant='outlined'>
                            <CardContent>
                                <Typography variant='h3' sx={{ mb: 1.5 }} color='text.secondary'>
                                    Split Chunks
                                </Typography>
                                <Typography variant='h1' component='div' gutterBottom>
                                    {postFileAndGetSplits.data?.chunks ?? 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item lg={4} md={4} sm={6} xs={12}>
                        <Card variant='outlined'>
                            <CardContent>
                                <Typography variant='h3' sx={{ mb: 1.5 }} color='text.secondary'>
                                    Tokens
                                </Typography>
                                <Typography variant='h1' component='div' gutterBottom>
                                    {postFileAndGetSplits.data?.tokens ?? 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item lg={4} md={4} sm={6} xs={12}>
                        <Card variant='outlined'>
                            <CardContent>
                                <Typography variant='h3' sx={{ mb: 1.5 }} color='text.secondary'>
                                    Total Characters
                                </Typography>
                                <Typography variant='h1' component='div' gutterBottom>
                                    {postFileAndGetSplits.data?.characters ?? 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
            {postFileAndGetSplits.data?.docs.length > 0 && (
                <Box sx={{ p: 1 }}>
                    <TableContainer style={{ marginTop: '30', border: 1 }} component={Paper}>
                        <Table sx={{ minWidth: 650 }} size='small' aria-label='a dense table'>
                            <caption>
                                Showing {postFileAndGetSplits.data?.docs.length ?? 0} of {postFileAndGetSplits.data?.chunks ?? 0} Documents.
                            </caption>
                            <TableHead>
                                <TableRow sx={{ marginTop: '10', backgroundColor: 'primary' }}>
                                    <TableCell component='h3' scope='row' style={{ width: '10%' }} key='0'>
                                        {' '}
                                    </TableCell>
                                    <TableCell component='h3' style={{ width: '75%' }} key='1'>
                                        Content
                                    </TableCell>
                                    <TableCell style={{ width: '15%' }} key='2'>
                                        Length
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {postFileAndGetSplits.data?.docs?.map((row, index) => (
                                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell key='0' component='th' scope='row'>
                                            {index + 1}
                                        </TableCell>
                                        <TableCell key='1'>{row.content}</TableCell>
                                        <TableCell key='2'>{row.length}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </div>
    )
}

export default Chunking
