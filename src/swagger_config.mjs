'use strict'
const apiConf = {
    //exposeRoute: true,
    hideUntagged: true,
    swagger: {
      info: {
        title: 'ODB Cruise API',
        description:
          '* This swagger-UI provides trials of ODB Cruise API.\n' +
          '* Directly using these APIs by HTTP GET method (shown as the block of Request URL) can be even much faster.\n' +
          '* Note that *this UI may get stuck if too much data being queryed.*',
        version: '1.0.0'
      },
      host: 'api.odb.ntu.edu.tw',
      schemes: ['https'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
}

export const uiConf = {
    routePrefix: '/cruise/public',
    staticCSP: true,
    transformStaticCSP: (header) => header,
    uiConfig: {
      validatorUrl: null,
      docExpansion: 'list', //'full'
      deepLinking: false
    } //https://github.com/fastify/fastify-swagger/issues/191
}

export default apiConf

