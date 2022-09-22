import S from 'fluent-json-schema'
import CRdata, {crdataJsonSchema} from '../models/crdata_schema.mjs'

export const autoPrefix = '/crqry'

export default async function crqry (fastify, opts, next) {
    const cridSchemaObj = {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Cruise Id in CR-data'}
      },
      required: ['id']
    }

    const uncaseArrMatch = (str, fuzzy=false) => {
      const items = str.split(',')
      let out = []
      items.forEach(function(item) {
        let re
        if (fuzzy) {
          re = new RegExp(item, "i")
        } else {
          re = new RegExp(`^${item}$`, "i")
        }
        out.push(re)
      })
      return out
    }

    fastify.get('/:id', {
      schema: {
        description: 'Fetch CRdata by cruise id',
        tags: ['crdata'],
        params: cridSchemaObj,
        response: {
          200:{
            type: 'array',
            items: crdataJsonSchema
          }
        }
      }
    },
    async (req, reply) => {
      let crids = uncaseArrMatch(req.params.id)
      const out = await
        CRdata.find({
          "CruiseBasicData.CruiseID": { $in: crids }
        })
      await reply.code(200).send(out)
    })

    fastify.get('/', {
      schema: {
        description: 'Fetch CRdata by querying criteria',
        tags: ['crdata'],
        query: {
          type: 'object',
          properties: {
            ship: { type: 'string' },
            crid: { type: 'string' },
            start: { type: 'string' },
            end: { type: 'string' },
            leader: { type: 'string'}
          }
        },
        response: {
          200:{
            type: 'array',
            items: crdataJsonSchema
          }
        }
      }
    },
    async (req, reply) => {
      const qstr = req.query
      let qry = {}
      if (typeof qstr.ship !== 'undefined') {
        if (qstr.ship.trim() !== "" && qstr.ship.indexOf("*") < 0) {
          let ships = uncaseArrMatch(qstr.ship.trim())
          qry = {"CruiseBasicData.ShipName": { $in: ships }}
        }
      }

      if (typeof qstr.crid !== 'undefined') {
        if (qstr.crid.trim() !== "" && qstr.crid.indexOf("*") < 0) {
          let crids = uncaseArrMatch(qstr.crid.trim())
          qry = {...qry, "CruiseBasicData.CruiseID": { $in: crids }}
        }
      }

      if (typeof qstr.leader !== 'undefined') {
        if (qstr.leader.trim() !== "" && qstr.leader.indexOf("*") < 0) {
          let leaders = qstr.leader.trim().split(",")
          qry = {...qry, "CruiseBasicData.LeaderName": { $in: leaders }}
        }
      }

      if (typeof qstr.start !== 'undefined') {
        let startd = Date.parse(qstr.start)
        if (!isNaN(startd)) {
          qry = {...qry, "CruiseBasicData.StartDate": { $gte: startd }}
        }
      }

      if (typeof qstr.end !== 'undefined') {
        let endd = Date.parse(qstr.end)
        if (!isNaN(endd)) {
          qry = {...qry, "CruiseBasicData.EndDate": { $lte: endd }}
        }
      }
      fastify.log.info(JSON.stringify(qry))

      const out = await
        CRdata.find(qry)
      await reply.code(200).send(out)
    })
  next()
}
