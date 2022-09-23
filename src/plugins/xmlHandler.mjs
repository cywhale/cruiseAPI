import { parse } from 'arraybuffer-xml-parser' //https://github.com/cheminfo/arraybuffer-xml-parser
import fp from 'fastify-plugin'
//import mongoose from 'mongoose'
//import csrSchema from '../models/csrSchema.mjs'

async function xmlHandler (fastify, opts) {
  fastify.decorate('onFile', onFile)

  async function onFile(part) {
    //const conn = mongoose.createConnection(fastify.config.MONGO_CONNECT)
    const { CSR } = fastify //conn.model('csr', csrSchema, 'csr')

    const buff = await part.toBuffer()
    const xml = buff.toString() //Buffer.from(buff.toString(), 'base64').toString()
    let jbody = parse(xml, {arrayMode: false})
    let data = jbody.CruiseReport
    let start, end, t1, t2
    if (!data || !data.CruiseBasicData) {
      throw new Error('Cruise Report Format Error: No data or no CruiseBasicData')
    } else {
      if (!data.CruiseBasicData.StartDate || !data.CruiseBasicData.EndDate) {
        throw new Error('Cruise Report Format Error: No StartDate or EndDate')
      } else {
        t1 = data.CruiseBasicData.StartDate.split(/\s+/)
        start = new Date(t1[0]+' '+ t1[1] + ':00:00').toISOString()
        t2 = data.CruiseBasicData.EndDate.split(/\s+/)
        end = new Date(t2[0]+' '+ t2[1] + ':00:00').toISOString()
      }
    }
    if (!start || !end) {
      throw new Error('Cruise Report Format Error: Format of StartDate or EndDate error, should be eg. 2022-01-01 10')
    } else {
      data.CruiseBasicData.StartDate = start
      data.CruiseBasicData.EndDate = end
    }
    fastify.log.info("Upload " + part.filename + " at " + fastify.conf.timestamp)
    fastify.log.info(data)
    part.value = data
    await CSR.create(data)
  }
}

export default fp(xmlHandler, {
  name: 'xmlHandler'
})

