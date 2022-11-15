//import S from 'fluent-json-schema'
//Mongoose Buffering mode cause esbuild bundle not connect //https://mongoosejs.com/docs/connections.html#buffering
//import CRdata, {crdataJsonSchema} from '../models/crdata_schema.mjs'
import mongoose from 'mongoose'
import //csrSchema,
       {csrJsonSchema} from '../models/csrSchema.mjs'

export const autoPrefix = '/csrqry'

export default async function csrqry (fastify, opts, next) {
    //const conn = mongoose.createConnection(fastify.config.MONGO_CONNECT)
    const { CSR } = fastify //conn.model('csr', csrSchema, 'csr')
    const sortCond = {sort: {"CruiseBasicData.ShipName": 1, "CruiseBasicData.StartDate": -1}}

    const csridSchemaObj = {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Cruise Id in CSR'}
      },
      required: ['id']
    }

    const uncaseArrMatch = (qstr, strmode=false, regex=true, fuzzy=false, wildcard=false, dot=false, dash=false) => {
      //replace quotes, double slash and spacing following comma
      let str = decodeURIComponent(qstr).replace(/['"]+/g,'').replace(/\/\//g, '').replace(/(,)\s/g, '$1').trim()
      if (wildcard) { str = str.replace(/\*/g, '(.*)') } //e.g. Wang* match Wangxx
      if (dash) { str = str.replace(/\s*-\s*|(?!(^|,|.))\s(?!(,|$))/g,'(-*\\s*)') }   //e.g. EA - 640 match EA-640 or EA 640 or EA640
      if (dot) { str = str.replace(/\.+\s*(?![\*])/g,'(\\.*\\s*)') }  //e.g. L.A. Liao match L. A. Liao or L.A.Liao or L>
      if (str.indexOf(',') >= (str.length-1)) { str = str.slice(0, -1) } //avoid 'ADCP 150khz, ' search all
      //fastify.log.info("Debug: "+ str)
      if (strmode) { return str }

      let items = str.split(/,\s*/) //but here , had been trimmed
      if (!regex) { return items }

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
        description: 'Fetch CSR data by cruise id',
        tags: ['CSR'],
        params: csridSchemaObj,
        response: {
          200:{
            type: 'array',
            items: csrJsonSchema
          }
        }
      }
    },
    async function (req, reply) {
      let itemx = uncaseArrMatch(req.params.id, false, true, false, true, false, false)
      const out = await
        CSR.find({
          "CruiseBasicData.CruiseID": { $in: itemx }
        }, {_id: 0 }, sortCond)
      reply.code(200).send(out)
    })

    fastify.get('/', {
      schema: {
        description: 'Fetch CSR data by querying criteria',
        tags: ['CSR'],
        query: {
          type: 'object',
          properties: {
            ship: { type: 'string' },
            crid: { type: 'string' },
            start: { type: 'string' },
            end: { type: 'string' },
            leader: { type: 'string'},
            user: { type: 'string'},
            item: { type: 'string'}
          }
        },
        response: {
          200:{
            type: 'array',
            items: csrJsonSchema
          }
        }
      }
    },
    async function (req, reply) {
      const qstr = req.query
      let qry = {}
      let itemx
      //Note: == uncaseArrMatch(qstr, strmode=false, regex=true, fuzzy=false, wildcard=false, dot=false, dash=false) ==
      if (typeof qstr.ship !== 'undefined') {
        if (qstr.ship.trim() !== '' && qstr.ship.trim() !== '*') { //.indexOf("*") < 0
          itemx = uncaseArrMatch(qstr.ship, false, true, false, true, false, false)
          qry = {"CruiseBasicData.ShipName": { $in: itemx }}
        }
      }

      if (typeof qstr.crid !== 'undefined') {
        if (qstr.crid.trim() !== '' && qstr.crid.trim() !== '*') {
          itemx = uncaseArrMatch(qstr.crid, false, true, false, true, false, false)
          qry = {...qry, "CruiseBasicData.CruiseID": { $in: itemx }}
        }
      }

      if (typeof qstr.leader !== 'undefined') {
        if (qstr.leader.trim() !== '' && qstr.leader.trim() !== '*') {
          itemx = uncaseArrMatch(qstr.leader, false, true, false, true, true, false)
          //itemx = leaders.trim().replace(/\.+\s*/g,'(\\.*|\\s*)').replace(/,\s*/,'|')
          qry = {...qry, "CruiseBasicData.LeaderName": { $in: itemx }}
        }
      }

      let after = null
      if (typeof qstr.start !== 'undefined') {
        itemx = uncaseArrMatch(qstr.start, true, false, false, false, false, false)
        let startd = Date.parse(itemx)
        if (!isNaN(startd)) {
          after = new Date(+new Date(itemx + ' ' + '00:00:00')  + 8 * 3600 * 1000) //.toISOString()
          //qry = {...qry, "CruiseBasicData.StartDate": { $gte: after }} //should be $and with end_date_criteria
        }
      }
      let before = null
      if (typeof qstr.end !== 'undefined') {
        itemx = uncaseArrMatch(qstr.end, true, false, false, false, false, false)
        let endd = Date.parse(itemx)
        if (!isNaN(endd)) {
          before = new Date(+new Date(itemx + ' ' + '23:59:59')  + 8 * 3600 * 1000) //.toISOString()
          //qry = {...qry, "CruiseBasicData.StartDate": { $lte: before }}
        }
      }
      if (after !== null && before !== null) {
        qry = {...qry, $and:[{"CruiseBasicData.StartDate": { $gte: after }}, {"CruiseBasicData.StartDate": { $lte: before }}]}
      } else if (after !== null) {
        qry = {...qry, "CruiseBasicData.StartDate": { $gte: after }}
      } else if (before !== null) {
        qry = {...qry, "CruiseBasicData.StartDate": { $lte: before }}
      }

      if (typeof qstr.user !== 'undefined') {
        if (qstr.user.trim() !== '' && qstr.user.trim() !== '*') {
          //Note that Participants.Name is an array, so need to match array with array
          itemx = uncaseArrMatch(qstr.user, true, false, false, true, true, false).replace(/,\s*/g,"|") //map(x => '^'+x+'$').join("|")
          //let Rex = new RegExp(`/${itemx}/`, 'i')
          qry = {...qry, $or:[ //{"CruiseBasicData.LeaderName": Rex},{"Participants.Name": Rex}]}
                         {"CruiseBasicData.LeaderName": { $regex: itemx, $options: "ix"}},
                         {"CruiseBasicData.Technician": { $regex: itemx, $options: "ix"}},
                         {"Participants.Name": { $regex: itemx, $options: "ix"}}]}
        }
      }

      if (typeof qstr.item !== 'undefined') {
        if (qstr.item.trim() !== '' && qstr.item.trim() !== '*') {
          //Note that it can work because we create text index(EquipIndex) of MongoDB on CruiseData.Item and Equipment, use $text search
          //let items = qstr.item.replace(/['"]+/g,'').replace(/\/\//g, '').replace(/\,/g, '|').replace(/(-|\s)/g, '(-*|\\s*)')
          itemx = uncaseArrMatch(qstr.item, true, false, false, true, false, true).replace(/,\s*/g,"|")
          qry = {...qry, $or:[ //{$text: { $search: itemx.replace(/,\s*/g,"|")}},
                         {"CruiseData.Item": { $regex: itemx, $options: "ix"}},
                         {"Physical.Equipment": { $regex: itemx, $options: "ix"}},
                         {"Biogeochemical.Equipment": { $regex: itemx, $options: "ix"}},
                         {"Biology.Equipment": { $regex: itemx, $options: "ix"}},
                         {"Geology.Equipment": { $regex: itemx, $options: "ix"}},
                         {"Geophysics.Equipment": { $regex: itemx, $options: "ix"}},
                         {"Atmosphere.Equipment": { $regex: itemx, $options: "ix"}},
                         {"Other.Equipment": { $regex: itemx, $options: "ix"}}]}
        }
      }
      if (Array.isArray(itemx)) {
        fastify.log.info(itemx.join(', '))
      } else {
        fastify.log.info(itemx)
      }
      fastify.log.info(JSON.stringify(qry))

      const out = await CSR.find(qry, {_id: 0 }, sortCond)
      reply.code(200).send(out)
    })

    const csrDelSchemaObj = {
      type: 'object',
      properties: {
        ship: { type: 'string', description: 'Ship Name in CSR'},
        id: { type: 'string', description: 'Cruise Id in CSR'}
      },
      required: ['ship', 'id']
    }

    fastify.delete('/:ship/:id', {
      schema: {
        description: 'Delete CSR data by /ship name/cruise id',
        tags: ['CSR'],
        params: csrDelSchemaObj,
        response: 204
      }
    },
    async function(req, reply) {
      try {
        CSR.deleteOne({ "CruiseBasicData.ShipName": req.params.ship,
                     "CruiseBasicData.CruiseID": req.params.id }, function(err, cb) {
          if (err) fastify.log.error(err)
          fastify.log.info("Remove CSR: " + req.params.ship + "/" + req.params.id)
        })
	reply.code(204)

      } catch(err) {
        fastify.log.error(err)
      }
    })

    const csrDelAfterSchemaObj = {
      type: 'object',
      properties: {
        start: { type: 'string', description: 'Start Date to delete in CSR'}
      },
      required: ['start']
    }

    const MultiDelHandler = async (req, reply, DateOp="CruiseBasicData.StartDate") => {
      const qstr = req.query
      let qry={}, itemx

      //Note: == uncaseArrMatch(qstr, strmode=false, regex=true, fuzzy=false, wildcard=false, dot=false, dash=false) ==
      itemx = uncaseArrMatch(req.params.start, true, false, false, false, false, false)
      let startd = Date.parse(itemx)
      if (!isNaN(startd)) {
        startd = new Date(+new Date(itemx)  + 8 * 3600 * 1000) //.toISOString()
        qry[DateOp] = { $gte: startd }
      } else {
        fastify.log.info("Wrong state date: " + req.params.start)
        reply.code(400)
        return
      }

      if (typeof qstr.ship !== 'undefined') {
        if (qstr.ship.trim() !== '' && qstr.ship.trim() !== '*') { //.indexOf("*") < 0
          itemx = uncaseArrMatch(qstr.ship, false, true, false, true, false, false)
          qry = {...qry, "CruiseBasicData.ShipName": { $in: itemx }}
        }
      }

      if (typeof qstr.end !== 'undefined') {
        itemx = uncaseArrMatch(qstr.end, true, false, false, false, false, false)
        let endd = Date.parse(itemx)
        if (!isNaN(endd)) {
          endd = new Date(+new Date(itemx + ' ' + '23:59:59')  + 8 * 3600 * 1000) //.toISOString()
          let endq = {}
          endq[DateOp] = { $lte: endd }
          qry = {...qry, endq}
        }
      }

      try {
        CSR.deleteMany(qry, function(err, cb) {
          if (err) fastify.log.error(err)
          fastify.log.info("Remove CSR: " + JSON.stringify(qry))
        })
        reply.code(204)

      } catch(err) {
        fastify.log.error(err)
      }
    }

    fastify.delete('/start/:start', {
      schema: {
        description: 'Delete all CSR data after given Cruise StartDate',
        tags: ['CSR'],
        params: csrDelAfterSchemaObj,
        query: {
          type: 'object',
          properties: {
            ship: { type: 'string' },
            end: { type: 'string' },
          }
        },
        response: 204
      }
    }, async function(req, reply) {
      MultiDelHandler(req, reply, "CruiseBasicData.StartDate")
    })

    fastify.delete('/updated/:start', {
      schema: {
        description: 'Delete all CSR data after given UpdatedAt date of database',
        tags: ['CSR'],
        params: csrDelAfterSchemaObj,
        query: {
          type: 'object',
          properties: {
            ship: { type: 'string' },
            end: { type: 'string' },
          }
        },
        response: 204
      }
    }, async function(req, reply) {
      MultiDelHandler(req, reply, "updatedAt")
    })

  next()
}
