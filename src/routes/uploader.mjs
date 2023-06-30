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

  next()
}
