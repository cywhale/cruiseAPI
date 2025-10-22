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
      querystring: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date-time', description: 'ISO timestamp (UTC) inclusive lower bound' },
          end: { type: 'string', format: 'date-time', description: 'ISO timestamp (UTC) inclusive upper bound' },
          limit: { type: 'integer', minimum: 1, description: 'Maximum number of latest points to return' }
        },
        additionalProperties: false
      },
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
              //source: { type: "string" }
            }
          }
        }
      }
    }
  },
  async function(req, reply) {
    const ship = fastify.config[`TABLE_${req.params.ship}`]
    if (!ship) {
      reply.code(204)
      return
    }

    const parseIsoDate = (value, label) => {
      if (!value) return null
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) {
        reply.code(400).send({ message: `Invalid ${label} parameter` })
        return null
      }
      return parsed
    }

    const toDbDate = (date) => {
      if (!date) return null
      return date
    }

    const toUtcIso = (value) => {
      if (!value) return value
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return value
      return parsed.toISOString()
    }

    const { start: startRaw, end: endRaw, limit: limitRaw } = req.query ?? {}
    const startDate = parseIsoDate(startRaw, 'start')
    if (startRaw && !startDate) return
    let endDate = parseIsoDate(endRaw, 'end')
    if (endRaw && !endDate) return

    let limit = null
    if (limitRaw !== undefined) {
      const parsedLimit = Number.parseInt(limitRaw, 10)
      if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
        reply.code(400).send({ message: 'limit must be a positive integer' })
        return
      }
      limit = parsedLimit
    }

    const now = new Date()
    let boundedStart = startDate
    let boundedEnd = endDate

    if (boundedStart && !boundedEnd) {
      boundedEnd = now
    }

    if (!boundedStart && boundedEnd) {
      if (limit === null) {
        const dayStart = new Date(Date.UTC(
          boundedEnd.getUTCFullYear(),
          boundedEnd.getUTCMonth(),
          boundedEnd.getUTCDate()
        ))
        boundedStart = dayStart
      }
      boundedEnd = endDate
    }

    if (boundedStart && boundedEnd && boundedStart > boundedEnd) {
      reply.code(400).send({ message: 'start must be earlier than end' })
      return
    }

    const query = shipdb(ship)
      .select({
        longitude: 'lon',
        latitude: 'lat',
        ctime: 'ctime',
        updtime: 'updtime'
      })
      .orderBy('ctime', 'desc')

    if (boundedStart || boundedEnd) {
      const startDb = toDbDate(boundedStart)
      const endDb = toDbDate(boundedEnd ?? now)
      if (startDb && endDb) {
        query.whereBetween('ctime', [startDb, endDb])
      } else if (startDb) {
        query.where('ctime', '>=', startDb)
      } else if (endDb) {
        query.where('ctime', '<=', endDb)
      }
    }

    if (limit) {
      query.limit(limit)
    } else if (!boundedStart && !boundedEnd) {
      query.limit(1)
    }

    const rows = await query
    if (!rows || rows.length === 0) {
      reply.send([])
      return
    }

    const normalized = rows.map((row) => {
      const output = { ...row }
      output.ctime = toUtcIso(output.ctime)
      output.updtime = toUtcIso(output.updtime)
      return output
    })

    reply.send(normalized)
  })
}
