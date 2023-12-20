import client from './client'

const getSplits = (body) => client.post('/playground/splits', body)

export default {
    getSplits
}
