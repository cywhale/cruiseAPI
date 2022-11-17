export const autoPrefix = '/ship'

export default async function shiploc (fastify, opts, next) {
  const shipSchemaObj = {
    type: 'object',
    properties: {
      ship: { type: 'string', description: 'Ship Name'},
    },
    required: ['ship']
  }

  const { shipdb } = fastify

  fastify.get('/:ship', {
    schema: {
      description: 'Get ship latest location by /ship',
      tags: ['Vessel'],
      params: shipSchemaObj,
      response: {
        200: {
          $id: "#shipLocSchema",
          type: "array",
          items: {
            type: "object" ,
            required: [
              "longitude", "latitude", "ctime"
            ],
            properties: {
              longitude: { type: "number" },
              latitude: { type: "number" },
              ctime: { type: "string", format: "date-time" },
              updtime: { type: "string", format: "date-time" },
              source: { type: "string" }
            }
          }
        }
      }
    }
  },
  async function(req, reply) {
    const ship = fastify.config[`TABLE_${req.params.ship}`]
    let qry = 'SELECT TOP 1 lon as "longitude", lat as "latitude", ctime as "ctime", ' +
          'updtime as "updtime" ' + //, source as "source" ' +
          `From ${ship}`
    fastify.log.info("Query: " + qry)
    if (ship) {
      const data = await shipdb.raw(qry)
      fastify.log.info("Data: " + JSON.stringify(data))
      reply.send(data)
    } else {
      reply.code(204)
    }
  })

  next()
}
