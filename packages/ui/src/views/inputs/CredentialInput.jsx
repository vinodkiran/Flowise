import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'

// material-ui
import { Box, FormControl, Stack, Popper, TextField, Typography, IconButton } from '@mui/material'
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete'
import { useTheme, styled } from '@mui/material/styles'

// third party
import * as Yup from 'yup'
import { Formik } from 'formik'

// project imports
import AnimateButton from '@/ui-component/button/AnimateButton'
import { StyledButton } from '@/ui-component/button/StyledButton'

// API
import credentialApi from '@/api/workflows.credentials'
import oauth2Api from '@/api/workflows.oauth2'

// Hooks
import useApi from '@/hooks/useApi'
import useScriptRef from '@/hooks/useScriptRef'

// icons
import { IconCopy } from '@tabler/icons-react'

//css
import './InputParameters.css'

import { TooltipWithParser } from '@/ui-component/tooltip/TooltipWithParser'
import AddEditCredentialDialog from '../credentials/AddEditCredentialDialog'
import credentialsApi from '@/api/credentials'

const StyledPopper = styled(Popper)({
    boxShadow: '0px 8px 10px -5px rgb(0 0 0 / 20%), 0px 16px 24px 2px rgb(0 0 0 / 14%), 0px 6px 30px 5px rgb(0 0 0 / 12%)',
    borderRadius: '10px',
    [`& .${autocompleteClasses.listbox}`]: {
        boxSizing: 'border-box',
        '& ul': {
            padding: 10,
            margin: 10
        }
    }
})

const ADD_NEW_CREDENTIAL = '- Create New -'

// ==============================|| CREDENTIAL INPUT ||============================== //

const CredentialInput = ({
    initialParams,
    paramsType,
    initialValues,
    initialValidation,
    valueChanged,
    paramsChanged,
    onSubmit,
    ...others
}) => {
    const scriptedRef = useScriptRef()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const [credentialValidation, setCredentialValidation] = useState({})
    const [credentialValues, setCredentialValues] = useState({})
    const [nodeCredentialName, setNodeCredentialName] = useState('')
    const [credentialParams, setCredentialParams] = useState([])
    const [credentialOptions, setCredentialOptions] = useState([])
    const [oAuth2RedirectURL, setOAuth2RedirectURL] = useState('')

    const getCredentialParamsApi = useApi(credentialApi.getCredentialParams)
    const getRegisteredCredentialsByNameApi = useApi(credentialApi.getCredentialsByName)
    const [showSpecificCredentialDialog, setShowSpecificCredentialDialog] = useState(false)
    const [specificCredentialDialogProps, setSpecificCredentialDialogProps] = useState({})
    const [credentialId, setCredentialId] = useState('')
    const [reloadTimestamp, setReloadTimestamp] = useState(Date.now().toString())

    const onChanged = (values) => {
        const updateValues = values
        updateValues.submit = null
        valueChanged(updateValues, paramsType)
    }

    const getCredentialRequestBody = (values) => {
        if (credentialParams.length === 0) throw new Error('Credential params empty')

        const credentialData = {}
        for (let i = 0; i < credentialParams.length; i += 1) {
            const credParamName = credentialParams[i].name
            if (credParamName in values) credentialData[credParamName] = values[credParamName]
        }
        delete credentialData.name

        const credBody = {
            name: values.name,
            nodeCredentialName: values.credentialMethod,
            credentialData
        }

        return credBody
    }

    const updateYupValidation = (inputName, validationKey) => {
        const updateValidation = {
            ...credentialValidation,
            [inputName]: Yup.object({ [validationKey]: Yup.string().required(`${inputName} is required`) })
        }
        setCredentialValidation(updateValidation)
    }

    const clearCredentialParams = () => {
        const updateParams = initialParams.filter((item) => credentialParams.every((paramItem) => item.name !== paramItem.name))
        setCredentialParams([])
        setOAuth2RedirectURL('')

        paramsChanged(updateParams, paramsType)
    }

    const clearCredentialParamsValues = (value) => {
        let updateValues = JSON.parse(JSON.stringify(credentialValues))

        for (let i = 0; i < credentialParams.length; i += 1) {
            const credParamName = credentialParams[i].name
            if (credParamName in updateValues) delete updateValues[credParamName]
        }
        updateValues = {
            ...updateValues,
            registeredCredential: value
        }
        valueChanged(updateValues, paramsType)
    }

    const onConfirmAsyncOption = (selectedCredentialId = '') => {
        setCredentialId(selectedCredentialId)
        setReloadTimestamp(Date.now().toString())
        setSpecificCredentialDialogProps({})
        setShowSpecificCredentialDialog(false)
        //onSelect(selectedCredentialId)
    }

    const openOAuth2PopUpWindow = (oAuth2PopupURL) => {
        const windowWidth = 500
        const windowHeight = 400
        const left = window.screenX + (window.outerWidth - windowWidth) / 2
        const top = window.screenY + (window.outerHeight - windowHeight) / 2.5
        const title = `Connect Credential`
        const url = oAuth2PopupURL
        const popup = window.open(url, title, `width=${windowWidth},height=${windowHeight},left=${left},top=${top}`)
        return popup
    }

    const findMatchingOptions = (options, value) => options.find((option) => option.name === value)

    const getDefaultOptionValue = () => ''

    // getRegisteredCredentialsByNameApi successful
    useEffect(() => {
        if (getRegisteredCredentialsByNameApi.data) {
            const credentialOptions = []
            if (getRegisteredCredentialsByNameApi.data.length) {
                for (let i = 0; i < getRegisteredCredentialsByNameApi.data.length; i += 1) {
                    credentialOptions.push({
                        id: getRegisteredCredentialsByNameApi.data[i].id,
                        name: getRegisteredCredentialsByNameApi.data[i].name
                    })
                }
            }
            credentialOptions.push({
                name: ADD_NEW_CREDENTIAL
            })
            setCredentialOptions(credentialOptions)
            if (initialParams.find((prm) => prm.name === 'registeredCredential')) {
                updateYupValidation('registeredCredential', 'name')
            }
        }
    }, [getRegisteredCredentialsByNameApi.data])

    // getCredentialParamsApi successful
    useEffect(() => {
        if (getCredentialParamsApi.data) {
            const newCredentialParams = getCredentialParamsApi.data.inputs

            const credentialNameParam = {
                label: 'Credential Name',
                name: 'name',
                type: 'string',
                default: ''
            }

            newCredentialParams.unshift(credentialNameParam)

            setCredentialParams(newCredentialParams)

            const updateParams = initialParams

            for (let i = 0; i < newCredentialParams.length; i += 1) {
                const credParamName = newCredentialParams[i].name
                if (initialParams.find((prm) => prm.name === credParamName) === undefined) {
                    updateParams.push(newCredentialParams[i])
                }
            }
            paramsChanged(updateParams, paramsType)
        }
    }, [getCredentialParamsApi.data])

    // Initialize values
    useEffect(() => {
        setCredentialValues(initialValues)
        if (initialValues && initialValues.credentialMethod) {
            getRegisteredCredentialsByNameApi.request(initialValues.credentialMethod)
            setNodeCredentialName(initialValues.credentialMethod)
        }
    }, [initialValues])

    // Initialize validation
    useEffect(() => {
        setCredentialValidation(initialValidation)
    }, [initialValidation])

    return (
        <>
            <Box sx={{ width: 400 }}>
                <Formik
                    enableReinitialize
                    initialValues={credentialValues}
                    validationSchema={Yup.object().shape(credentialValidation)}
                    onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
                        try {
                            if (scriptedRef.current) {
                                const isAddNewCredential =
                                    values && values.registeredCredential && values.registeredCredential.name === ADD_NEW_CREDENTIAL

                                if (!isAddNewCredential && (credentialParams.length === 0 || !values.credentialMethod)) {
                                    onSubmit(values.credentialMethod ? { ...values, submit: true } : { submit: true }, paramsType)
                                    setStatus({ success: true })
                                    setSubmitting(false)
                                } else {
                                    // const body = getCredentialRequestBody(values)
                                    // let response
                                    // if (isAddNewCredential) {
                                    //     response = await credentialApi.createNewCredential(body)
                                    // } else {
                                    //     response = await credentialApi.updateCredential(values.registeredCredential.id, body)
                                    // }
                                    // if (response.data) {
                                    //     // Open oAuth2 window
                                    //     if (values.credentialMethod.toLowerCase().includes('oauth2')) {
                                    //         const oAuth2PopupURL = await oauth2Api.geOAuth2PopupURL(response.data.id)
                                    //         const popUpWindow = openOAuth2PopUpWindow(oAuth2PopupURL.data)
                                    //
                                    //         const oAuth2Completed = async (event) => {
                                    //             if (event.data === 'success') {
                                    //                 window.removeEventListener('message', oAuth2Completed, false)
                                    //
                                    //                 const submitValues = {
                                    //                     credentialMethod: values.credentialMethod,
                                    //                     registeredCredential: {
                                    //                         id: response.data.id,
                                    //                         name: response.data.name
                                    //                     },
                                    //                     submit: true
                                    //                 }
                                    //                 clearCredentialParams()
                                    //                 onSubmit(submitValues, paramsType)
                                    //                 setStatus({ success: true })
                                    //                 setSubmitting(false)
                                    //
                                    //                 if (popUpWindow) {
                                    //                     popUpWindow.close()
                                    //                 }
                                    //             }
                                    //         }
                                    //         window.addEventListener('message', oAuth2Completed, false)
                                    //         return
                                    //     }
                                    //
                                    //     const submitValues = {
                                    //         credentialMethod: values.credentialMethod,
                                    //         registeredCredential: {
                                    //             id: response.data.id,
                                    //             name: response.data.name
                                    //         },
                                    //         submit: true
                                    //     }
                                    //     clearCredentialParams()
                                    //     onSubmit(submitValues, paramsType)
                                    //     setStatus({ success: true })
                                    //     setSubmitting(false)
                                    // } else {
                                    //     throw new Error(response)
                                    // }
                                }
                            }
                        } catch (err) {
                            console.error(err)
                            if (scriptedRef.current) {
                                setStatus({ success: false })
                                setErrors({ submit: err.message })
                                setSubmitting(false)
                            }
                        }
                    }}
                >
                    {({ errors, handleBlur, handleChange, handleSubmit, setFieldValue, isSubmitting, values }) => (
                        <form noValidate onSubmit={handleSubmit} {...others}>
                            {initialParams.map((input) => {
                                if (input.type === 'options') {
                                    const inputName = input.name
                                    const availableOptions = input.options || []

                                    return (
                                        <FormControl key={inputName} fullWidth sx={{ mb: 1, mt: 1 }}>
                                            <Stack direction='row'>
                                                <Typography variant='overline'>{input.label}</Typography>
                                                {input.description && <TooltipWithParser title={input.description} />}
                                            </Stack>
                                            <Autocomplete
                                                id={inputName}
                                                freeSolo
                                                options={availableOptions}
                                                value={findMatchingOptions(availableOptions, values[inputName]) || getDefaultOptionValue()}
                                                onChange={(e, selection) => {
                                                    const value = selection ? selection.name : ''
                                                    setFieldValue(inputName, value)
                                                    const overwriteValues = {
                                                        [inputName]: value
                                                    }
                                                    onChanged(overwriteValues)
                                                    clearCredentialParams()
                                                    if (selection) {
                                                        getRegisteredCredentialsByNameApi.request(value)
                                                        setNodeCredentialName(value)
                                                    } else {
                                                        setCredentialOptions([])
                                                    }
                                                }}
                                                onBlur={handleBlur}
                                                PopperComponent={StyledPopper}
                                                renderInput={(params) => (
                                                    <TextField {...params} value={values[inputName]} error={Boolean(errors[inputName])} />
                                                )}
                                                renderOption={(props, option) => (
                                                    <Box component='li' {...props}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <Typography sx={{ p: 1 }} variant='h5'>
                                                                {option.label}
                                                            </Typography>
                                                            {option.description && (
                                                                <Typography sx={{ p: 1 }}>{option.description}</Typography>
                                                            )}
                                                        </div>
                                                    </Box>
                                                )}
                                            />
                                            {errors[inputName] && (
                                                <span style={{ color: 'red', fontSize: '0.7rem', fontStyle: 'italic' }}>
                                                    *{errors[inputName]}
                                                </span>
                                            )}
                                        </FormControl>
                                    )
                                }
                                return null
                            })}

                            {initialParams.find((prm) => prm.name === 'registeredCredential') && (
                                <FormControl fullWidth sx={{ mb: 1, mt: 1 }}>
                                    <Stack direction='row'>
                                        <Typography variant='overline'>Registered Credential</Typography>
                                        <TooltipWithParser title='Select previously registered credential OR add new credential' />
                                    </Stack>
                                    <Autocomplete
                                        id='registered-credential'
                                        freeSolo
                                        options={credentialOptions}
                                        value={values.registeredCredential && values.credentialMethod ? values.registeredCredential : ' '}
                                        getOptionLabel={(option) => option.name || ' '}
                                        onChange={async (e, selectedCredential) => {
                                            setFieldValue(
                                                'registeredCredential',
                                                selectedCredential !== null ? selectedCredential : initialValues.registeredCredential
                                            )
                                            const overwriteValues = {
                                                ...values,
                                                registeredCredential: selectedCredential
                                            }
                                            onChanged(overwriteValues)
                                            if (selectedCredential) {
                                                if (selectedCredential.name !== ADD_NEW_CREDENTIAL) {
                                                    const resp = await credentialApi.getSpecificCredential(selectedCredential.id)
                                                    if (resp.data) {
                                                        const updateValues = {
                                                            ...overwriteValues,
                                                            ...resp.data.credentialData,
                                                            name: resp.data.name
                                                        }
                                                        valueChanged(updateValues, paramsType)
                                                    }
                                                } else {
                                                    let names = ''
                                                    // if (inputParam.credentialNames.length > 1) {
                                                    //     names = inputParam.credentialNames.join('&')
                                                    // } else {
                                                    names = overwriteValues.credentialMethod
                                                    // }
                                                    clearCredentialParamsValues(selectedCredential)
                                                    const componentCredentialsResp = await credentialsApi.getSpecificComponentCredential(
                                                        names
                                                    )
                                                    if (componentCredentialsResp.data) {
                                                        if (Array.isArray(componentCredentialsResp.data)) {
                                                            // const dialogProp = {
                                                            //     title: 'Add New Credential',
                                                            //     componentsCredentials: componentCredentialsResp.data
                                                            // }
                                                            // setCredentialListDialogProps(dialogProp)
                                                            // setShowCredentialListDialog(true)
                                                        } else {
                                                            const dialogProp = {
                                                                type: 'ADD',
                                                                cancelButtonName: 'Cancel',
                                                                confirmButtonName: 'Add',
                                                                credentialComponent: componentCredentialsResp.data
                                                            }
                                                            setSpecificCredentialDialogProps(dialogProp)
                                                            setShowSpecificCredentialDialog(true)
                                                        }
                                                    }
                                                    // setSpecificCredentialDialogProps(dialogProp)
                                                    // setShowSpecificCredentialDialog(true)
                                                }
                                                getCredentialParamsApi.request(nodeCredentialName)
                                                if (values.credentialMethod.toLowerCase().includes('oauth2')) {
                                                    const redirectURLResp = await oauth2Api.geOAuth2RedirectURL()
                                                    if (redirectURLResp.data) setOAuth2RedirectURL(redirectURLResp.data)
                                                }
                                            }
                                        }}
                                        onInputChange={(e, value) => {
                                            if (!value) {
                                                clearCredentialParams()
                                                clearCredentialParamsValues('')
                                            }
                                        }}
                                        onBlur={handleBlur}
                                        PopperComponent={StyledPopper}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                value={values.registeredCredential}
                                                error={Boolean(errors.registeredCredential)}
                                            />
                                        )}
                                        renderOption={(props, option) => (
                                            <Box component='li' {...props}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography sx={{ p: 1 }} variant='h5'>
                                                        {option.name}
                                                    </Typography>
                                                </div>
                                            </Box>
                                        )}
                                    />
                                    {errors.registeredCredential && (
                                        <span style={{ color: 'red', fontSize: '0.7rem', fontStyle: 'italic' }}>
                                            *Registered Credential is required
                                        </span>
                                    )}
                                </FormControl>
                            )}

                            {oAuth2RedirectURL && (
                                <div>
                                    <Typography variant='overline'>OAuth2 Redirect URL</Typography>
                                    <Stack direction='row'>
                                        <Typography
                                            sx={{
                                                p: 1,
                                                borderRadius: 10,
                                                backgroundColor: theme.palette.primary.light,
                                                width: 'max-content',
                                                height: 'max-content'
                                            }}
                                            variant='h5'
                                        >
                                            {oAuth2RedirectURL}
                                        </Typography>
                                        <IconButton
                                            title='Copy URL'
                                            color='primary'
                                            onClick={() => navigator.clipboard.writeText(oAuth2RedirectURL)}
                                        >
                                            <IconCopy />
                                        </IconButton>
                                    </Stack>
                                </div>
                            )}

                            {/*{values.credentialMethod &&*/}
                            {/*    credentialParams.map((input) => {*/}
                            {/*        if (input.type === 'json') {*/}
                            {/*            const inputName = input.name*/}

                            {/*            return (*/}
                            {/*                <FormControl key={inputName} fullWidth sx={{ mb: 1, mt: 1 }} error={Boolean(errors[inputName])}>*/}
                            {/*                    <Stack direction='row'>*/}
                            {/*                        <Typography variant='overline'>{input.label}</Typography>*/}
                            {/*                        {input.description && <TooltipWithParser title={input.description} />}*/}
                            {/*                    </Stack>*/}
                            {/*                    <PerfectScrollbar*/}
                            {/*                        style={{*/}
                            {/*                            border: '1px solid',*/}
                            {/*                            borderColor: theme.palette.grey['500'],*/}
                            {/*                            borderRadius: '12px',*/}
                            {/*                            height: '200px',*/}
                            {/*                            maxHeight: '200px',*/}
                            {/*                            overflowX: 'hidden',*/}
                            {/*                            backgroundColor: 'white'*/}
                            {/*                        }}*/}
                            {/*                        onScroll={(e) => e.stopPropagation()}*/}
                            {/*                    >*/}
                            {/*                        {customization.isDarkMode ? (*/}
                            {/*                            <DarkCodeEditor*/}
                            {/*                                value={values[inputName] || ''}*/}
                            {/*                                onValueChange={(code) => {*/}
                            {/*                                    setFieldValue(inputName, code)*/}
                            {/*                                }}*/}
                            {/*                                placeholder={input.placeholder}*/}
                            {/*                                type={input.type}*/}
                            {/*                                onBlur={(e) => {*/}
                            {/*                                    const overwriteValues = {*/}
                            {/*                                        ...values,*/}
                            {/*                                        [inputName]: e.target.value*/}
                            {/*                                    }*/}
                            {/*                                    onChanged(overwriteValues)*/}
                            {/*                                }}*/}
                            {/*                                style={{*/}
                            {/*                                    fontSize: '0.875rem',*/}
                            {/*                                    minHeight: '200px',*/}
                            {/*                                    width: '100%'*/}
                            {/*                                }}*/}
                            {/*                            />*/}
                            {/*                        ) : (*/}
                            {/*                            <LightCodeEditor*/}
                            {/*                                value={values[inputName] || ''}*/}
                            {/*                                onValueChange={(code) => {*/}
                            {/*                                    setFieldValue(inputName, code)*/}
                            {/*                                }}*/}
                            {/*                                placeholder={input.placeholder}*/}
                            {/*                                type='json'*/}
                            {/*                                onBlur={(e) => {*/}
                            {/*                                    const overwriteValues = {*/}
                            {/*                                        ...values,*/}
                            {/*                                        [inputName]: e.target.value*/}
                            {/*                                    }*/}
                            {/*                                    onChanged(overwriteValues)*/}
                            {/*                                }}*/}
                            {/*                                style={{*/}
                            {/*                                    fontSize: '0.875rem',*/}
                            {/*                                    minHeight: '200px',*/}
                            {/*                                    width: '100%'*/}
                            {/*                                }}*/}
                            {/*                            />*/}
                            {/*                        )}*/}
                            {/*                    </PerfectScrollbar>*/}
                            {/*                    {errors[inputName] && (*/}
                            {/*                        <span style={{ color: 'red', fontSize: '0.7rem', fontStyle: 'italic' }}>*/}
                            {/*                            *{errors[inputName]}*/}
                            {/*                        </span>*/}
                            {/*                    )}*/}
                            {/*                </FormControl>*/}
                            {/*            )*/}
                            {/*        }*/}

                            {/*        if (input.type === 'string' || input.type === 'password' || input.type === 'number') {*/}
                            {/*            const inputName = input.name*/}

                            {/*            return (*/}
                            {/*                <FormControl key={inputName} fullWidth sx={{ mb: 1, mt: 1 }} error={Boolean(errors[inputName])}>*/}
                            {/*                    <Stack direction='row'>*/}
                            {/*                        <Typography variant='overline'>{input.label}</Typography>*/}
                            {/*                        {input.description && <TooltipWithParser title={input.description} />}*/}
                            {/*                    </Stack>*/}
                            {/*                    <OutlinedInput*/}
                            {/*                        id={inputName}*/}
                            {/*                        type={input.type === 'string' || input.type === 'number' ? 'text' : input.type}*/}
                            {/*                        value={values[inputName] || ''}*/}
                            {/*                        placeholder={input.placeholder}*/}
                            {/*                        name={inputName}*/}
                            {/*                        onBlur={(e) => {*/}
                            {/*                            handleBlur(e)*/}
                            {/*                            onChanged(values)*/}
                            {/*                        }}*/}
                            {/*                        onChange={handleChange}*/}
                            {/*                    />*/}
                            {/*                    {errors[inputName] && (*/}
                            {/*                        <span style={{ color: 'red', fontSize: '0.7rem', fontStyle: 'italic' }}>*/}
                            {/*                            *{errors[inputName]}*/}
                            {/*                        </span>*/}
                            {/*                    )}*/}
                            {/*                </FormControl>*/}
                            {/*            )*/}
                            {/*        }*/}

                            {/*        if (input.type === 'boolean') {*/}
                            {/*            const inputName = input.name*/}

                            {/*            return (*/}
                            {/*                <FormControl key={inputName} fullWidth sx={{ mb: 1, mt: 1 }} error={Boolean(errors[inputName])}>*/}
                            {/*                    <Stack direction='row'>*/}
                            {/*                        <Typography variant='overline'>{input.label}</Typography>*/}
                            {/*                        {input.description && <TooltipWithParser title={input.description} />}*/}
                            {/*                    </Stack>*/}
                            {/*                    <Switch*/}
                            {/*                        checked={!!values[inputName]}*/}
                            {/*                        onChange={(event) => {*/}
                            {/*                            setFieldValue(inputName, event.target.checked)*/}
                            {/*                            const overwriteValues = {*/}
                            {/*                                ...values,*/}
                            {/*                                [inputName]: event.target.checked*/}
                            {/*                            }*/}
                            {/*                            onChanged(overwriteValues)*/}
                            {/*                        }}*/}
                            {/*                        inputProps={{ 'aria-label': 'controlled' }}*/}
                            {/*                    />*/}
                            {/*                </FormControl>*/}
                            {/*            )*/}
                            {/*        }*/}

                            {/*        if (input.type === 'options') {*/}
                            {/*            const inputName = input.name*/}
                            {/*            const availableOptions = input.options || []*/}

                            {/*            return (*/}
                            {/*                <FormControl key={inputName} fullWidth sx={{ mb: 1, mt: 1 }}>*/}
                            {/*                    <Stack direction='row'>*/}
                            {/*                        <Typography variant='overline'>{input.label}</Typography>*/}
                            {/*                        {input.description && <TooltipWithParser title={input.description} />}*/}
                            {/*                    </Stack>*/}
                            {/*                    <Autocomplete*/}
                            {/*                        id={inputName}*/}
                            {/*                        freeSolo*/}
                            {/*                        options={availableOptions}*/}
                            {/*                        value={*/}
                            {/*                            findMatchingOptions(availableOptions, values[inputName]) || getDefaultOptionValue()*/}
                            {/*                        }*/}
                            {/*                        onChange={(e, selection) => {*/}
                            {/*                            const value = selection ? selection.name : ''*/}
                            {/*                            setFieldValue(inputName, value)*/}
                            {/*                            const overwriteValues = {*/}
                            {/*                                ...values,*/}
                            {/*                                [inputName]: value*/}
                            {/*                            }*/}
                            {/*                            onChanged(overwriteValues)*/}
                            {/*                        }}*/}
                            {/*                        onBlur={handleBlur}*/}
                            {/*                        PopperComponent={StyledPopper}*/}
                            {/*                        renderInput={(params) => (*/}
                            {/*                            <TextField*/}
                            {/*                                {...params}*/}
                            {/*                                value={values[inputName]}*/}
                            {/*                                error={Boolean(errors[inputName])}*/}
                            {/*                            />*/}
                            {/*                        )}*/}
                            {/*                        renderOption={(props, option) => (*/}
                            {/*                            <Box component='li' {...props}>*/}
                            {/*                                <div style={{ display: 'flex', flexDirection: 'column' }}>*/}
                            {/*                                    <Typography sx={{ p: 1 }} variant='h5'>*/}
                            {/*                                        {option.label}*/}
                            {/*                                    </Typography>*/}
                            {/*                                    {option.description && (*/}
                            {/*                                        <Typography sx={{ p: 1 }}>{option.description}</Typography>*/}
                            {/*                                    )}*/}
                            {/*                                </div>*/}
                            {/*                            </Box>*/}
                            {/*                        )}*/}
                            {/*                    />*/}
                            {/*                    {errors[inputName] && (*/}
                            {/*                        <span style={{ color: 'red', fontSize: '0.7rem', fontStyle: 'italic' }}>*/}
                            {/*                            *{errors[inputName]}*/}
                            {/*                        </span>*/}
                            {/*                    )}*/}
                            {/*                </FormControl>*/}
                            {/*            )*/}
                            {/*        }*/}
                            {/*        return null*/}
                            {/*    })}*/}

                            <Box sx={{ mt: 2 }}>
                                {!(values.credentialMethod || '').toLowerCase().includes('google') && (
                                    <AnimateButton>
                                        <StyledButton
                                            disableElevation
                                            disabled={isSubmitting || Object.keys(errors).length > 0}
                                            fullWidth
                                            size='large'
                                            type='submit'
                                            variant='contained'
                                            color='secondary'
                                        >
                                            {values &&
                                            values.registeredCredential &&
                                            (values.registeredCredential.name === ADD_NEW_CREDENTIAL || credentialParams.length)
                                                ? 'Save and Continue'
                                                : 'Continue'}
                                        </StyledButton>
                                    </AnimateButton>
                                )}
                                {/*{(values.credentialMethod || '').toLowerCase().includes('google') && (*/}
                                {/*    <StyledButton*/}
                                {/*        disabled={isSubmitting || Object.keys(errors).length > 0}*/}
                                {/*        fullWidth*/}
                                {/*        size='large'*/}
                                {/*        type='submit'*/}
                                {/*        variant='contained'*/}
                                {/*        color='secondary'*/}
                                {/*        sx={{ p: 0, margin: 0 }}*/}
                                {/*    >*/}
                                {/*        <div*/}
                                {/*            style={{*/}
                                {/*                alignItems: 'center',*/}
                                {/*                display: 'flex',*/}
                                {/*                width: '100%',*/}
                                {/*                height: 50,*/}
                                {/*                background: 'white'*/}
                                {/*            }}*/}
                                {/*        >*/}
                                {/*            <img*/}
                                {/*                style={{ objectFit: 'contain', height: '100%', width: '100%', padding: 7 }}*/}
                                {/*                src={gLoginLogo}*/}
                                {/*                alt='Google Login'*/}
                                {/*            />*/}
                                {/*        </div>*/}
                                {/*    </StyledButton>*/}
                                {/*)}*/}
                            </Box>
                        </form>
                    )}
                </Formik>
                {showSpecificCredentialDialog && (
                    <AddEditCredentialDialog
                        show={showSpecificCredentialDialog}
                        dialogProps={specificCredentialDialogProps}
                        onCancel={() => setShowSpecificCredentialDialog(false)}
                        onConfirm={onConfirmAsyncOption}
                    ></AddEditCredentialDialog>
                )}
            </Box>
        </>
    )
}

CredentialInput.propTypes = {
    initialParams: PropTypes.array,
    paramsType: PropTypes.string,
    initialValues: PropTypes.object,
    initialValidation: PropTypes.object,
    valueChanged: PropTypes.func,
    paramsChanged: PropTypes.func,
    onSubmit: PropTypes.func
}

export default CredentialInput
