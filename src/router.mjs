import AutoLoad from '@fastify/autoload'
import MultiPart from '@fastify/multipart'
import { join } from 'desm'

export default async function router (fastify, opts) {
  const { CSR, onFile } = fastify

  fastify.register(MultiPart, {
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 2000000, // Max field value size in bytes
      fields: 100,        // Max number of non-file fields
      fileSize: 20000000, // For multipart forms, the max file size in bytes
      files: 1,           // Max number of file fields
      headerPairs: 20000  // Max number of header key=>value pairs
    },
    attachFieldsToBody: 'keyValues', //Note, only for small files: https://backend.cafe/fastify-multipart-upload
    onFile
  })

  fastify.addHook('onSend', async (req, reply, payload) => {
    if (req.method === 'POST' && req.url === '/cruise/data/upload') {
      //fastify.log.info("keyValues: " + JSON.stringify(req.body.data))
      const keyValues =  req.body.data // that configured in router.mjs, and modified in onFile
      const shipx = keyValues.CruiseBasicData.ShipName.trim()
      const cridx = keyValues.CruiseBasicData.CruiseID.trim()
      fastify.log.info(`Search ship/cruise: ${shipx}/${cridx}`)
      const out = await CSR.find({ $and: [{
             "CruiseBasicData.ShipName": { $eq: shipx }
          },{"CruiseBasicData.CruiseID": { $eq: cridx }}]}) //, function(err, out) { //).exec() //a Promise
      //fastify.log.info(`${typeof out}`)
      //fastify.log.info(out.length) //Note at this time, uploading is done, so cannot use findOne (always has at least one)
      //fastify.log.info(out)
      reply.code(200)
      if (out && out.length > 1) {
        payload = JSON.stringify({"Warning": `Database has duplicated ship/cruise: ${shipx}/${cridx}! Check it!!`})
      } else {
        payload = JSON.stringify({"Success": `Upload at ${new Date().toISOString()}`})
      }
      return payload
    }
  })

  fastify.register(AutoLoad, {
      dir: join(import.meta.url, 'routes'),
      dirNameRoutePrefix: false,
      options: Object.assign({prefix: `${fastify.config.BASE_URL}/`}, opts)
  })
}
