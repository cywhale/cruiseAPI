//import fs, { readFileSync } from 'fs'
//import util from 'util'
//import { pipeline } from 'stream'
//import concatStream from 'concat-stream'
export const autoPrefix = '/data'

export default async function apirest (fastify, opts, next) {
  //const pump = util.promisify(pipeline)
  //const { concat } = concatStream
  fastify.post('/upload', async function (req, reply) {
    const uploadValue = req.body.upload // access file as base64 string
    //const data = await req.file()
    //await pump(data.file, fs.createWriteStream('data/upload/' + data.filename))
    /*await pump(data.file, concat(function (buf) {
            let xml = buf.toString() //https://github.com/fastify/fastify-multipart/blob/master/test/multipart.test.js
          }))*/
    reply.code(200).send()
  })

  next()
}
