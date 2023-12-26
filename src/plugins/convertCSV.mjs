import { AsyncParser } from '@json2csv/node' //https://github.com/juanjoDiaz/json2csv
import fs from 'fs'
import fp from 'fastify-plugin'

async function convertCSV (fastify, opts) {
  fastify.decorate('json2CSV', json2CSV)

  async function json2CSV (data, file, reply, userFileName, toCsvOpts={}) {
    const asyncOpts = {}                       // Async buffer options
    const transformOpts = { objectMode: true } // stream Transform options
    const parser = new AsyncParser(toCsvOpts, asyncOpts, transformOpts)

    // Create a writable stream to a file
    const writableStream = fs.createWriteStream(file, { encoding: 'utf8' })
    reply.raw.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename=' + userFileName,
    })

    // Handle stream events - finish and error
    writableStream.on('finish', async () => {
      fastify.log.info(`CSV file has been written to ${file}`)
      const stream = fs.createReadStream(file, 'utf8')
      await stream.pipe(reply.raw)
      await reply.hijack()
    })

    writableStream.on('error', (err) => {
      fastify.log.error('Error writing CSV file:', err)
      throw err
    })

    // Pipe the parser output to the file
    parser.parse(data).pipe(writableStream)
    /* return new Promise((resolve, reject) => {
      writableStream.on('finish', () => {
        fastify.log.info(`CSV file has been written to ${file}`)
        resolve(file)
      })

      writableStream.on('error', (err) => {
        fastify.log.error('Error writing CSV file:', err)
        reject(err)
      })

      parser.parse(data).pipe(writableStream)
    }) */
  }
}

export default fp(convertCSV, {
  name: 'convertCSV'
})

