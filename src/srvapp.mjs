import AutoLoad from '@fastify/autoload'
import Cors from '@fastify/cors'
import Static from '@fastify/static'
import { join } from 'desm'
import router from './router.mjs'

export default async function (fastify, opts) {
  fastify.decorate('conf', {
    timestamp: new Date().toISOString()
  })

//for SHIP SQLSERVER 202211
  fastify.register(import('./module/knexconn.mjs'), {
    knexName: 'shipdb',
    knexOptions: {
      client: 'mssql',
      connection: {
        host: fastify.config.SQLSERVER,
        user: fastify.config.SHIPUSER,
        password: fastify.config.SHIPPASS,
        database: fastify.config.SHIPDB,
        port: fastify.config.SQLPORT,
        options: {
          cancelTimeout: 10000,
          requestTimeout: 20000,
          connectTimeout: 10000,
          encrypt: false,
          trustServerCertificate: true,
          multipleStatements: true,
          validateBulkLoadParameters: false
        }
      },
      pool: {
        max: 5,
        min: 0
      }
    }
  }).ready(async () => {
    try { // first connection
      const { shipdb } = fastify
      fastify.log.info({actor: 'Knex'}, 'Connected to SHIP mssql database & first query trial...')
      shipdb.raw(
          'SELECT TOP 1 lon as "longitude", lat as "latitude", ctime as "ctime"' +
          //'updtime as "updtime", source as "source" ' +
          `From ${fastify.config.TABLE_NOR1}`
      ).then(data => {
        fastify.log.info('Test SHIPDB first data' + JSON.stringify(data))
        //next()
      })
    } catch(err) {
      fastify.log.error({actor: 'Knex'}, 'Error: Knex for SHIPDB Register failed.' + err)
      //next()
    }
  })

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
        methods: ['GET', 'POST', 'OPTIONS'], //'HEAD', 'PUT', 'PATCH', 'DELETE'
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
/* parsingCode not yet...
  fastify.addContentTypeParser('application/xml', (req, done) => {
    const parsedBody = parsingCode(req)
    done(null, parsedBody)
  })
*/
  fastify.register(Static, {
    root: join(import.meta.url, '..', 'public'),
    prefix: `${fastify.config.BASE_URL}/form`,
  })

  fastify.register(router)
}
