//import fs, { readFileSync } from 'fs'
//import util from 'util'
//import { pipeline } from 'stream'
//import concatStream from 'concat-stream'
export const autoPrefix = '/data'

export default async function apirest (fastify, opts, next) {
  const { CSR, onFile } = fastify

  fastify.post('/upload', async function (req, reply) {
    //const data = await req.file()
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
  })

  next()
}
