import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Card,
    CardMedia,
    IconButton,
    Typography,
    CardActions
} from '@mui/material'
import PropTypes from 'prop-types'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'

function FileUploadDialog({ open, onClose }) {
    const [files, setFiles] = useState([])
    const [previews, setPreviews] = useState([])
    const [currentUrl, setCurrentUrl] = useState('')

    const dialogStyle = {
        // position: 'absolute',
        // top: `${position.top}px`,
        // left: `${position.left}px`,
        // transform: 'translateY(-100%)' // Adjust to appear above the button
    }
    const onDrop = useCallback(async (acceptedFiles) => {
        let files = acceptedFiles.map((file) => {
            const reader = new FileReader()
            const { name } = file

            return new Promise((resolve) => {
                reader.onload = (evt) => {
                    if (!evt?.target?.result) {
                        return
                    }
                    const { result } = evt.target
                    const data = result + `,filename:${name}`
                    resolve({
                        data: data,
                        preview: URL.createObjectURL(file),
                        type: 'file'
                    })
                }
                reader.readAsDataURL(file)
            })
        })

        const newFiles = await Promise.all(files)
        //
        // const newFiles = acceptedFiles.map((file) => ({
        //     data: file,
        //     preview: URL.createObjectURL(file),
        //     type: 'file'
        // }))
        setFiles((prevFiles) => [...prevFiles, ...newFiles])
        setPreviews((prevPreviews) => [...prevPreviews, ...newFiles])
    }, [])

    const handleAddUrl = () => {
        if (currentUrl) {
            const newUrlPreview = {
                data: currentUrl,
                preview: currentUrl, // For URLs, the preview is the URL itself
                type: 'url'
            }
            setPreviews([...previews, newUrlPreview])
            setCurrentUrl('') // Reset input field
        }
    }

    const handleCurrentUrlChange = (event) => {
        setCurrentUrl(event.target.value)
    }

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: 'image/*',
        multiple: true // Set to 'true' if you wish to allow multiple files
    })

    const handleDeletePreview = (itemToDelete) => {
        if (itemToDelete.type === 'file') {
            setFiles(files.filter((file) => file.data.path !== itemToDelete.data.path))
            URL.revokeObjectURL(itemToDelete.preview) // Clean up for file
        }
        setPreviews(previews.filter((item) => item !== itemToDelete))
    }

    const handleClose = () => {
        clearObjectURLs()
        setPreviews([])
        setFiles([])
        setCurrentUrl('')
        onClose(false, undefined)
    }

    const handleConfirm = () => {
        clearObjectURLs()
        onClose(true, previews)
    }

    const clearObjectURLs = () => {
        previews.forEach((item) => {
            if (item.type === 'file') {
                URL.revokeObjectURL(item.preview)
            }
        })
    }

    const previewStyle = {
        width: '64px',
        height: '64px',
        objectFit: 'cover' // This makes the image cover the area, cropping it if necessary
    }

    return (
        <Dialog open={open} onClose={handleClose} style={dialogStyle} maxWidth='sm' fullWidth>
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
                    </Grid>
                    <Grid item>
                        <Typography variant='h6'>Enter a Web URL to upload</Typography>
                    </Grid>
                    <Grid item>
                        <Grid container spacing={1} alignItems='flex-end'>
                            <Grid item xs>
                                <TextField
                                    label='Enter URL'
                                    variant='outlined'
                                    fullWidth
                                    value={currentUrl}
                                    placeholder={'https://example.com/image.png'}
                                    onChange={handleCurrentUrlChange}
                                    onKeyPress={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault()
                                            handleAddUrl()
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item>
                                <IconButton onClick={handleAddUrl}>
                                    <AddIcon />
                                </IconButton>
                            </Grid>
                        </Grid>
                        <Grid item>
                            <Grid container spacing={2} style={{ marginTop: '16px' }}>
                                {previews.map((item, index) => (
                                    <Grid item xs={12} sm={6} md={3} key={index}>
                                        <Card variant='outlined' sx={{ maxWidth: 64 }}>
                                            <CardMedia
                                                component='img'
                                                image={item.preview}
                                                sx={{ height: 64 }}
                                                alt={`preview ${index}`}
                                                style={previewStyle}
                                            />
                                            <CardActions sx={{ padding: 0, margin: 0 }}>
                                                <Button
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleDeletePreview(item)}
                                                    size='small'
                                                    variant='text'
                                                />
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
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
    onClose: PropTypes.func.isRequired,
    position: PropTypes.shape({
        top: PropTypes.number,
        left: PropTypes.number
    })
}

export default FileUploadDialog
