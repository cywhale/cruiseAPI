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
    onFile //it will register onFile for all routes.
  })
/*
  fastify.addHook('preHandler', async (req, reply) => {
    // Check if the route is '/data/upload' or if the file's mimetype is XML
    if (
      req.routerPath === '/data/upload' ||
      (req.isMultipart() && req.headers['content-type'].includes('xml'))
    ) {
      // Register the onFile plugin for XML file handling
      req.onFile(onFile)
    }
  })
*/
  fastify.addHook('onSend', async (req, reply, payload) => {
    if (req.method === 'POST' && req.url === '/cruise/data/upload') {
      //fastify.log.info("keyValues: " + JSON.stringify(req.body.data))
      //const result = req.body.data // that configured in router.mjs, and modified in onFile
      let data = []
      if (!Array.isArray(req.body.data)) {
        data = [req.body.data] //force it in array
      } else {
        data = [...req.body.data]
      }

      let mode = 'stop'
      if (typeof req.body.mode !== 'undefined') {
         mode = req.body.mode.toLowerCase()
         if (mode !== 'append' && mode !== 'stop' && mode !=='overwrite') {
           mode = 'stop'
         }
      }
      let shipx, cridx, qryx, code = 201, i=0
      let existingData, dup = [] //duplicated ship-crid in existing data
      let payload = 'Data'
      for (const result of data) {
        shipx = result.CruiseBasicData.ShipName
        cridx = result.CruiseBasicData.CruiseID
        qryx = {
          $and: [{ //find -> findOne 202306 (now write-in-db is after>
                  "CruiseBasicData.ShipName": { $eq: shipx }
               },{"CruiseBasicData.CruiseID": { $eq: cridx }}]
        }
        existingData = await CSR.findOne(qryx) //, function(err, out) { //).exec() //a Promise
        //let payload = `Data uploaded for ${shipx}:${cridx}`
        //fastify.log.info(`${payload}. ${existingData? 'Data existed': 'Data not existed'}. Mode: ${mode}(/${req.body.mode})`)
        if (existingData) {
          dup.push(`${shipx}-${cridx}-${i}`)
          if (mode === 'overwrite') {
            await CSR.updateOne(
                qryx, result, { new: true, upsert: true }
            )
            //payload = payload + '. Warning: Duplicated ship/cruise, and data overwritten successfully.\n'
          } else if (mode === 'append') {
            await CSR.create(result)
            //payload = payload + '. Warning: Duplicated ship/cruise, and data appended successfully.\n'
          } //else { //if (mode === 'stop') {
            //code = 204 //204 will not return payload
            //payload = payload + '. Error: Duplicated ship/cruise, and stop writing.\n'
          //}
        } else {
          await CSR.create(result)
          payload = payload + ` ${shipx}-${cridx}-${i},` //' successfully.\n'
        }
        i = i+1
      }
      if (dup.length === i && mode === 'stop') { code = 200 } //accepted, but no data write into CSR
      let dup_payload = dup.length > 0? ` but ${dup.join(',')} are duplicated with write-in-mode is '${mode}'.\n` : '.\n'
      payload = payload.replace(/,$/, "", payload) + ' were successfully uploaded' + dup_payload
      fastify.log.info(payload)
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
