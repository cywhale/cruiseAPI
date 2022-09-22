import AutoLoad from '@fastify/autoload'
import MultiPart from '@fastify/multipart'
import { join } from 'desm'

export default async function router (fastify, opts) {
  const { onFile } = fastify

  fastify.register(MultiPart, {
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 2000000, // Max field value size in bytes
      fields: 100,        // Max number of non-file fields
      fileSize: 20000000, // For multipart forms, the max file size in bytes
      files: 1,           // Max number of file fields
      headerPairs: 20000  // Max number of header key=>value pairs
    },
    attachFieldsToBody: 'keyValues',
    onFile
  })

  fastify.register(AutoLoad, {
      dir: join(import.meta.url, 'routes'),
      dirNameRoutePrefix: false,
      options: Object.assign({prefix: `${fastify.config.BASE_URL}/`}, opts)
  })
}
