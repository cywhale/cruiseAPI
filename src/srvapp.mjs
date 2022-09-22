import AutoLoad from '@fastify/autoload'
import Cors from '@fastify/cors'
//import Mongodb from '@fastify/mongodb'
import Static from '@fastify/static'
import { join } from 'desm'
//import db from './db.mjs'
import router from './router.mjs'

export default async function (fastify, opts) {
  fastify.decorate('conf', {
    timestamp: new Date().toISOString()
  })

//fastify.register(db, { url: fastify.config.MONGO_CONNECT }) //use mongoose
/*fastify.register(Mongodb, {
      forceClose: true,
      url: fastify.config.MONGO_CONNECT,
      name: 'cruise',
  })*/
  fastify.register(AutoLoad, {
    dir: join(import.meta.url, 'plugins'),
    options: Object.assign({ url: fastify.config.MONGO_CONNECT }, opts)
  })

  fastify.register(Cors, (instance) => {
    return (req, callback) => {
      const corsOptions = {
        origin: true,
        credentials: true,
        preflight: true,
        preflightContinue: true,
        methods: ['GET', 'POST', 'HEAD', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Keep-Alive', 'User-Agent',
                         'Cache-Control', 'Authorization', 'DNT', 'X-PINGOTHER', 'Range'],
        exposedHeaders: ['Content-Range'],
        maxAge: 86400,
      };
      // do not include CORS headers for requests from localhost
      if (/^localhost$/m.test(req.headers.origin)) {
        corsOptions.origin = false
      }
      callback(null, corsOptions)
    }
  })

  fastify.addContentTypeParser('application/xml', (req, done) => {
    const parsedBody = parsingCode(req)
    done(null, parsedBody)
  })

  fastify.register(Static, {
    root: join(import.meta.url, '..', 'public'),
    prefix: `${fastify.config.BASE_URL}/`,
  })

  fastify.register(router)
}
