'use strict'
import Fastify from 'fastify'
import Env from '@fastify/env'
import S from 'fluent-json-schema'
import Swagger from '@fastify/swagger'
import SwaggerUI from '@fastify/swagger-ui'
import { readFileSync } from 'fs'
import { join } from 'desm'
import srvapp from './srvapp.mjs'
import apiConf, { uiConf }  from './module/swagger_config.mjs'

const configSecServ = async (certDir='../config') => {
  const readCertFile = (filename) => {
    return readFileSync(join(import.meta.url, certDir, filename))
  };
  try {
    const [key, cert] = await Promise.all(
      [readCertFile('privkey.pem'), readCertFile('fullchain.pem')]);
    return {key, cert, allowHTTP1: true}
  } catch (err) {
    console.log('Error: certifite failed. ' + err)
    process.exit(1)
  }
}

const startServer = async () => {
  const PORT = 3010
  const {key, cert, allowHTTP1} = await configSecServ()
  const fastify = Fastify({
      http2: true,
      trustProxy: true,
      https: {key, cert, allowHTTP1},
      requestTimeout: 5000,
      logger: true,
      ajv: {
        customOptions: {
          coerceTypes: 'array'
        }
      }
  })

  fastify.register(Env, {
    dotenv: {
      path: join(import.meta.url, '../config', '.env'),
    },
    schema: S.object()
      .prop('COOKIE_SECRET', S.string().required())
      .prop('BASE_URL', S.string().required())
      .prop('MONGO_CONNECT', S.string().required())
      .prop('SQLSERVER', S.string().required())
      .prop('SQLPORT', S.integer().required())
      .prop('SHIPDB', S.string().required())
      .prop('SHIPUSER', S.string().required())
      .prop('SHIPPASS', S.string().required())
      .prop('TABLE_NOR1', S.string().required())
      .prop('TABLE_NOR2', S.string().required())
      .prop('TABLE_NOR3', S.string().required())
      .valueOf()
  }).ready((err) => {
    if (err) console.error(err)
  })

  fastify.register(Swagger, apiConf)
  fastify.register(SwaggerUI, uiConf)
  fastify.register(srvapp)

  fastify.listen({ port: PORT }, function (err, address) {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    //fastify.swagger()
    fastify.log.info(`server listening on ${address}`)
  })
}

startServer()

