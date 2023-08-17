//import fs, { readFileSync } from 'fs'
//import util from 'util'
//import { pipeline } from 'stream'
//import concatStream from 'concat-stream'
export const autoPrefix = '/data'

export default async function apirest (fastify, opts, next) {
  const { CSR, onFile } = fastify

  fastify.post('/upload', {
      schema: { //https://github.com/fastify/fastify-multipart/blob/master/callback.md
        description: 'Upload CSR XML',
        tags: ['UPLOAD'],
        body: {
          type: 'object',
          //required: [''], //mode can be none, or 'append'/'overwrite'/'stop'(default, if none)
          properties: {
            mode: { type: 'string' },
          //data: { type: 'array', items: 'MultipartFileType#' } //data file is not mentioned here because it will be handled separately
          }
        }
      }
    },
    async function (req, reply) {
      if (!req.isMultipart()) { //https://github.com/fastify/fastify-multipart/blob/master/callback.md
        fastify.log.error("Not a multipart request. Check it")
      }
      fastify.log.info(`Uploading Done at: ${new Date().toISOString()}`)
      //https://github.com/fastify/fastify-multipart/issues/131
      //  function onEnd(err) {
      //    if (err) {
      //      reply.code(500).send({ err })
      //    }
      //  }
      /*req.multipart(handler, onEnd, {
          limits: {...},
        })
      }*/
    }
  )
/*
  fastify.post('/json', {
      schema: {
        description: 'Upload CSR JSON',
        tags: ['UPLOAD'],
        body: {
          type: 'object',
          //required: [''], //mode can be none, or 'append'/'overwrite'/'stop'(default, if none)
          properties: {
            mode: { type: 'string' },
          }
        }
      }
    },
    async function (req, reply) {
      if (!req.isMultipart()) {
        fastify.log.error("Not a multipart request. Check it")
      }

      const data = []
      const parts = req.parts()
      // Process each part of the multipart form data
      for await (const part of parts) {
        //if (part.file) {
          // Assuming 'file' is the name of the field where the JSON file is uploaded
          const fileData = await part.toBuffer()
          const fileContent = fileData.toString()
          const parsedJson = JSON.parse(fileContent)
          data.push(...parsedJson);
        //}
        fastify.log.info("part is : " + JSON.stringify(part))
      }
    //const parts = await req.file()
    //fastify.log.info(`Uploading data ${JSON.stringify(parts)} at: ${new Date().toISOString()}`)
    //try {
      //const buffer = await parts.toBuffer()
      //const data = JSON.parse(buffer.toString())
        fastify.log.info(`Uploading data ${data.join(',')}`)

        let mode = 'stop'
        if (typeof req.body.mode !== 'undefined') {
           mode = req.body.mode.toLowerCase()
           if (mode !== 'append' && mode !== 'stop' && mode !=='overwrite') {
             mode = 'stop'
           }
        }

        // Save each data record to the CSR model
        let shipx, cridx, qryx, code = 201, i=0
        let dup = [] //duplicated ship-crid in existing data
        for (const record of data) {
          shipx = record.CruiseBasicData.ShipName
          cridx = record.CruiseBasicData.CruiseID
          qryx = {
            $and: [{ //find -> findOne 202306 (now write-in-db is after>
                     "CruiseBasicData.ShipName": { $eq: shipx }
                  },{"CruiseBasicData.CruiseID": { $eq: cridx }}]
          }
          const existingData = await CSR.findOne(qryx)

          if (existingData) {
            dup.push(`${shipx}-${cridx}-${i}`)
            if (mode === 'overwrite') {
              await CSR.updateOne(
                qryx, record, { new: true, upsert: true }
              )
            } else if (mode === 'append') {
              await CSR.create(record)
            } //else { //if (mode === 'stop') {
              //fastify.log.info('Error: Duplicated ship/cruise, and stop writing.\n')
            //}
          } else {
            await CSR.create(record)
          }
          i = i+1
        }
        if (dup.length === i && mode === 'stop') { code = 200 } //accepted, but no data write into CSR
        let payload = dup.length > 0? ` but ${dup.join(',')} are duplicated with write-in-mode is '${mode}'` : '.'
        fastify.log.info("Data uploaded by JSON" + payload)
        reply.code(code).send({ message: 'Data uploaded successfully' + payload })
      //} catch (err) {
      //  fastify.log.error(err)
      //  reply.code(500).send(JSON.stringify({"Error": err}))
      //}
    }
  )
*/
  next()
}
