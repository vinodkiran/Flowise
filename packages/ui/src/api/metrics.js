import client from './client'

//const getInferences = () => client.get('/inferences')
const getInferences = (params = {}) => client.get(`/inferences`, { params: { order: 'DESC', ...params } })

export default {
    getInferences
}
