import client from './client'

const deleteAllTestWebhooks = () => client.post(`/workflows/remove-test-webhooks`)
const getTunnelURL = () => client.get(`/workflows/get-tunnel-url`)

export default {
    getTunnelURL,
    deleteAllTestWebhooks
}
