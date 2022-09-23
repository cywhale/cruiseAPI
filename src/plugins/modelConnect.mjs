import fp from 'fastify-plugin'
import mongoose from 'mongoose'
import csrSchema from '../models/csrSchema.mjs'

const modelConnect = async (fastify, options) => {
    const conn = mongoose.createConnection(fastify.config.MONGO_CONNECT)
    const CSR = conn.model('csr', csrSchema, 'csr')
    fastify.decorate('CSR', CSR)
}
export default fp(modelConnect)
