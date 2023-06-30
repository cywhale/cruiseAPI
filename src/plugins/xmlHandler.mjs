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
        if (t1[1].indexOf(":") >= 0) {
          start = new Date(+new Date(t1[0]+' '+ t1[1] + ':00') + 8 * 3600 * 1000).toISOString() //GMT+8 problem
        } else {
          start = new Date(+new Date(t1[0]+' '+ t1[1] + ':00:00')  + 8 * 3600 * 1000).toISOString()
        }
        t2 = data.CruiseBasicData.EndDate.split(/\s+/)
        if (t2[1].indexOf(":") >= 0) {
          end = new Date(+new Date(t2[0]+' '+ t2[1] + ':00') + 8 * 3600 * 1000).toISOString()
        } else {
          end = new Date(+new Date(t2[0]+' '+ t2[1] + ':00:00') + 8 * 3600 * 1000).toISOString()
        }
      }
    }
    if (!start || !end) {
      throw new Error('Cruise Report Format Error: Format of StartDate or EndDate error, should be eg. 2022-01-01 10')
    } else {
      data.CruiseBasicData.StartDate = start
      data.CruiseBasicData.EndDate = end
    }

    //check empty keys
    for (let prop in data) {
      if ((typeof data[prop] === 'object' && Object.keys(data[prop]).length === 0) ||
          (typeof data[prop] === 'string' && data[prop].trim() === "")) {
        delete data[prop]
      }
    }

    if (!data.CruiseBasicData.ShipName) {
      throw new Error('Cruise Report Format Error: No ShipName')
    } else {
      data.CruiseBasicData.ShipName = data.CruiseBasicData.ShipName.toString().trim() //convert only digits ID to string
    }

    if (!data.CruiseBasicData.CruiseID) {
      throw new Error('Cruise Report Format Error: No CruiseID')
    } else {
      data.CruiseBasicData.CruiseID = data.CruiseBasicData.CruiseID.toString().trim() //convert only digits ID to string
    }

    fastify.log.info(`Upload/Before write-in ${part.filename} for ${data.CruiseBasicData.ShipName}:${data.CruiseBasicData.CruiseID} at ${new Date().toISOString()}`)
    //fastify.log.info(data)
    part.value = data
    //await CSR.create(data) //move to src/router.mjs write-in when onSend to do check logic 202306
  }
}

export default fp(xmlHandler, {
  name: 'xmlHandler'
})

