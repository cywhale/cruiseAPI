export const autoPrefix = '/ship'

export default async function shiploc (fastify, opts) {
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
    //fastify.log.info("Query: " + qry)
    if (ship) {
      const data = await shipdb.raw(qry)
      if (req.params.ship !== 'NOR1') {  //Note NOR2, NOR3 is local time, not UTC time (but NOR1 is UTC time), that's confused 202212
        data[0].ctime = new Date(+new Date(data[0].ctime) - 8 * 3600 * 1000).toISOString()
      }
      data[0].updtime = new Date(+new Date(data[0].updtime) - 8 * 3600 * 1000).toISOString()
      //fastify.log.info("Data: " + JSON.stringify(data))
      reply.send(data)
    } else {
      reply.code(204)
    }
  })
}
