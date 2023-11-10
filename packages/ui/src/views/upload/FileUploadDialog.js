import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Dialog, DialogActions, DialogContent, Button, TextField, Grid, Card, CardMedia } from '@mui/material'
import PropTypes from 'prop-types'

function FileUploadDialog({ open, onClose }) {
    const [files, setFiles] = useState([])
    const [filePreviews, setFilePreviews] = useState([])
    const [url, setUrl] = useState('')

    const onDrop = useCallback((acceptedFiles) => {
        setFiles(acceptedFiles)
        setFilePreviews(
            acceptedFiles.map((file) =>
                Object.assign(file, {
                    preview: URL.createObjectURL(file)
                })
            )
        )
    }, [])

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: 'image/*',
        multiple: false // Set to 'true' if you wish to allow multiple files
    })

    const handleClose = (confirm) => {
        // Revoke the data uris to avoid memory leaks
        filePreviews.forEach((file) => URL.revokeObjectURL(file.preview))
        setFilePreviews([])
        onClose(confirm, url, files)
    }

    const handleConfirm = () => {
        // Process the confirmation action, such as uploading the files or URL
        // eslint-disable-next-line no-console
        console.log('Files to upload:', files)
        // eslint-disable-next-line no-console
        console.log('URL:', url)
        handleClose(true)
    }

    const handleUrlChange = (event) => {
        setUrl(event.target.value)
    }

    const previewStyle = {
        width: '64px',
        height: '64px',
        objectFit: 'cover' // This makes the image cover the area, cropping it if necessary
    }

    const handleOpen = () => {
        setFiles([])
        setUrl('')
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
            <DialogContent>
                <Grid container spacing={2} direction='column'>
                    <Grid item>
                        <div
                            {...getRootProps({ className: 'dropzone' })}
                            style={{ border: '2px dashed #eeeeee', padding: '20px', textAlign: 'center' }}
                        >
                            <input {...getInputProps()} />
                            <p>Drag and drop a file here, or click to select a file</p>
                        </div>
                        <Grid container spacing={2} style={{ marginTop: '16px' }}>
                            {filePreviews.map((file, index) => (
                                <Grid item xs={6} key={index}>
                                    <Card>
                                        <CardMedia component='img' image={file.preview} alt={`preview ${index}`} style={previewStyle} />
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                    <Grid item>Enter a Web URL to upload</Grid>
                    <Grid item>
                        <TextField label='Enter URL' variant='outlined' fullWidth value={url} onChange={handleUrlChange} />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color='secondary'>
                    Cancel
                </Button>
                <Button onClick={handleConfirm} color='primary'>
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    )
}

FileUploadDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
}

export default FileUploadDialog
