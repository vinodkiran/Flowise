import client from './client'

const getCredentials = (credentialName) => client.get('/credentials', { params: { credentialName } })
const getCredentialsByName = (componentCredentialName) => client.get(`/credentials?credentialName=${componentCredentialName}`)

const getCredentialParams = (name) => client.get(`/components-credentials/${name}`)

const getSpecificCredential = (id, isEncrypted) => client.get(`/credentials/${id}`, { params: { isEncrypted } })
const getSpecificComponentCredential = (name) => client.get(`/components-credentials/${name}`)

const createNewCredential = (credentialBody) => client.post(`/credentials`, credentialBody) //credentialBody: ICredential

const updateCredential = (id, credentialBody) => client.put(`/credentials/${id}`, credentialBody) //credentialBody: ICredential

const deleteCredential = (id) => client.delete(`/credentials/${id}`)

export default {
    getSpecificComponentCredential,
    getCredentials,
    getCredentialsByName,
    getCredentialParams,
    getSpecificCredential,
    createNewCredential,
    updateCredential,
    deleteCredential
}
