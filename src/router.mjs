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
      const result =  req.body.data // that configured in router.mjs, and modified in onFile
      let mode = 'stop'
      if (typeof req.body.mode !== 'undefined') {
         mode = req.body.mode.toLowerCase()
         if (mode !== 'append' && mode !== 'stop' && mode !=='overwrite') {
           mode = 'stop'
         }
      }
      const shipx = result.CruiseBasicData.ShipName
      const cridx = result.CruiseBasicData.CruiseID
      let qryx = {
        $and: [{ //find -> findOne 202306 (now write-in-db is after>
                 "CruiseBasicData.ShipName": { $eq: shipx }
              },{"CruiseBasicData.CruiseID": { $eq: cridx }}]
      }
      const existingData = await CSR.findOne(qryx) //, function(err, out) { //).exec() //a Promise
      let code = 200
      let payload = `Data uploaded for ${shipx}:${cridx}`
      //fastify.log.info(`${payload}. ${existingData? 'Data existed': 'Data not existed'}. Mode: ${mode}(/${req.body.mode})`)
      if (existingData) {
        if (mode === 'overwrite') {
            await CSR.updateOne(
                qryx, result, { new: true, upsert: true }
            )
            payload = payload + '. Warning: Duplicated ship/cruise, and data overwritten successfully.\n'
        } else if (mode === 'append') {
            await CSR.create(result)
            payload = payload + '. Warning: Duplicated ship/cruise, and data appended successfully.\n'
        } else { //if (mode === 'stop') {
            //code = 204 //204 will not return payload
            payload = payload + '. Error: Duplicated ship/cruise, and stop writing.\n'
        }
      } else {
        await CSR.create(result)
        payload = payload + ' successfully.\n'
      }
      //old: Note at this time, uploading is done, so cannot use findOne (always has at least one)
      //if (existingData && existingData.length > 1) {
      //  payload = JSON.stringify({"Warning": `Database has duplicated ship/cruise: ${shipx}/${cridx}! Check it!!`})
      //} else {
      //  payload = JSON.stringify({"Success": `Upload at ${new Date().toISOString()}`})
      //}
      reply.code(code) //.send(payload)
      return payload
    }
  })

  fastify.register(AutoLoad, {
      dir: join(import.meta.url, 'routes'),
      dirNameRoutePrefix: false,
      options: Object.assign({prefix: `${fastify.config.BASE_URL}/`}, opts)
  })
}
