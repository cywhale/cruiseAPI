//import S from 'fluent-json-schema'
//Mongoose Buffering mode cause esbuild bundle not connect //https://mongoosejs.com/docs/connections.html#buffering
//import CRdata, {crdataJsonSchema} from '../models/crdata_schema.mjs'
import mongoose from 'mongoose'
import fs from 'fs'
import tmp from 'tmp'
//import path from 'path'
import //csrSchema,
       {csrJsonSchema} from '../models/csrSchema.mjs'

export const autoPrefix = '/csrqry'

export default async function csrqry (fastify, opts, next) {
    //const conn = mongoose.createConnection(fastify.config.MONGO_CONNECT)
    const { CSR, json2CSV } = fastify //conn.model('csr', csrSchema, 'csr')
    const sortCond = {sort: {"CruiseBasicData.ShipName": 1, "CruiseBasicData.StartDate": -1}}

    const csridSchemaObj = {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Cruise Id in CSR'}
      },
      required: ['id']
    }

    const csrCsvFields = [
            { label: 'ShipName', value: 'CruiseBasicData.ShipName' },
            { label: 'CruiseID', value: 'CruiseBasicData.CruiseID' },
            { label: 'LeaderName', value: 'CruiseBasicData.LeaderName' },
            { label: 'ExploreOcean', value: 'CruiseBasicData.ExploreOcean' },
            { label: 'FarestDistance', value: 'CruiseBasicData.FarestDistance' },
            { label: 'TotalDistance', value: 'CruiseBasicData.TotalDistance' },
            { label: 'FuelConsumption', value: 'CruiseBasicData.FuelConsumption' },
            { label: 'StartDate', value: 'CruiseBasicData.StartDate' },
            { label: 'EndDate', value: 'CruiseBasicData.EndDate' },
            { label: 'StartPort', value: 'CruiseBasicData.StartPort' },
            { label: 'EndPort', value: 'CruiseBasicData.EndPort' },
            { label: 'DurationDays', value: 'CruiseBasicData.DurationDays' },
            { label: 'DurationHours', value: 'CruiseBasicData.DurationHours' },
            { label: 'PlanName', value: 'CruiseBasicData.PlanName' },
            { label: 'Technician', value: 'CruiseBasicData.Technician' },
            { label: 'Remark', value: 'CruiseBasicData.Remark' },
            // Participants
            { label: 'Participants_Department', value: (row) => row.Participants.Department.join(', ') },
            { label: 'Participants_Name', value: (row) => row.Participants.Name.join(', ') },
            /* Assuming CruiseData.Item and similar are arrays
            { label: 'Item', value: (row) => row.CruiseData.Item.join(', ') },
            { label: 'CollectionNum', value: (row) => row.CruiseData.CollectionNum.join(', ') },
            { label: 'CollectionOwner', value: (row) => row.CruiseData.CollectionOwner.join(', ') },
            { label: 'ReasonChecked', value: (row) => row.CruiseData.ReasonChecked.join(', ') },
            { label: 'Reason', value: (row) => row.CruiseData.Reason.join(', ') },
            // Assuming Other.Equipment is an array
            { label: 'Equipment', value: (row) => row.CruiseData.Other.Equipment.join(', ') },
            { label: 'Summary1', value: (row) => row.CruiseData.Other.Summary1.join(', ') },
            { label: 'Summary2', value: (row) => row.CruiseData.Other.Summary2.join(', ') },
            { label: 'DataOwner', value: (row) => row.CruiseData.Other.DataOwner.join(', ') },*/
            // createdAt and updatedAt
            //{ label: 'CreatedAt', value: 'createdAt' },
            //{ label: 'UpdatedAt', value: 'updatedAt' }
          ]

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

    const getDateTimeFileName = (prefix='csr', ext='.csv', time_enable=true) => {
      const now = new Date()
      const year = now.getFullYear()
      const month = (now.getMonth() + 1).toString().padStart(2, '0') // Month is 0-indexed
      const day = now.getDate().toString().padStart(2, '0')
      if (!time_enable) {
        return `${prefix}_${year}-${month}-${day}${ext}`
      }

      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      return `${prefix}_${year}-${month}-${day}T${hours}${minutes}${seconds}${ext}`;
    }

    const csvHandler = async (data, filename, reply, format) => {
      if (typeof format !== 'undefined' && format.trim().toLowerCase() === 'csv') {
        try {
          const tmpFile = tmp.fileSync({ postfix: '.csv' }) //path.join(__dirname, filename)
          await json2CSV(data, tmpFile.name, reply, filename, { fields: csrCsvFields, withBOM: true })
        } catch (err) {
          fastify.log.error(err)
          return reply.send(err)
        }
      } else {
        return reply.code(200).send(data)
      }
    }

    fastify.get('/:ship/:id', {
      schema: {
        description: 'Fetch CSR data by /ship-name/cruise-id',
        tags: ['CSR'],
        params: csridSchemaObj,
        query: {
          type: 'object',
          properties: {
            format: { type: 'string' },
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
      let shipx = uncaseArrMatch(req.params.ship, false, true, false, true, false, false)
      let itemx = uncaseArrMatch(req.params.id, false, true, false, true, false, false)
      const out = await
        CSR.find({
          "CruiseBasicData.ShipName": { $in: shipx },
          "CruiseBasicData.CruiseID": { $in: itemx }
        }, {_id: 0 }, sortCond)

      //reply.code(200).send(out)
      csvHandler(out, getDateTimeFileName(), reply, req.query.format)
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
            item: { type: 'string'},
            format: {type: 'string'}
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
      //reply.code(200).send(out)
      csvHandler(out, getDateTimeFileName(), reply, req.query.format)
    })

    const csrDelSchemaObj = {
      type: 'object',
      properties: {
        ship: { type: 'string', description: 'Ship Name in CSR'},
        id: { type: 'string', description: 'Cruise ID in CSR'}
      },
      required: ['ship', 'id']
    }

    const updValSchema = {
          $id: '#updStrSchema',
          description: 'Schema for updated value is in type string',
          type: 'object',
          properties: {
            field: { type: 'string', description: 'Field to update in CSR' },
          /*value: { //type: 'string', description: 'New value for the field (string)'
              oneOf: [
                { type: 'string', description: 'New value for the field (string)' },
                { type: 'array', items: { type: 'string' }, description: 'New value for the field (array of strings)' }
              ]
            }*/
          },
          required: ['field'] //, 'value']
    }
/*
    const updArrSchema = {
          $id: '#updArrSchema',
          description: 'Schema for updated value is in type array of string',
          type: 'object',
          properties: {
            field: { type: 'string', description: 'Field to update in CSR' },
            value: { type: 'array', items: { type: 'string' }, description: 'New value for the field (array of strings)' }
          },
          required: ['field', 'value']
    }
*/
// 202307 add Update API
    fastify.patch('/:ship/:id', {
      schema: {
        description: 'Update CSR data by by /ship-name/cruise-id',
        tags: ['CSR'],
        params: csrDelSchemaObj,
        body: updValSchema,
          //{ oneOf: [updStrSchema, updArrSchema] }
        //},
        response: {
          200:{
            type: 'array',
            items: csrJsonSchema
          }
        }
      }
    },
    async function (req, reply) {
      const fieldToUpdate = req.body.field;
      const updatedValue = req.body.value;
      try {
        const csr = await
          CSR.findOneAndUpdate({
            //"CruiseBasicData.CruiseID": { $in: itemx }
            "CruiseBasicData.ShipName": req.params.ship,
            "CruiseBasicData.CruiseID": req.params.id
          },
          { $set: { [fieldToUpdate]: updatedValue } },
          { new: true })

        if (!csr) {
          reply.code(404).send({"Error": "Data to be modified not found"})
          return
        }

        reply.code(200).send([csr])

      } catch (err) {
        fastify.log.error(err)
        reply.code(500).send(JSON.stringify({"Error": err}))
      }
    })

    fastify.delete('/:ship/:id', {
      schema: {
        description: 'Delete CSR data by /ship-name/cruise-id',
        tags: ['CSR'],
        params: csrDelSchemaObj,
        response: 204
      }
    },
    async function(req, reply) {
      //try { //mongoose >= v7 not support callback in deleteOne for function(err, cb)
        CSR.deleteOne({ "CruiseBasicData.ShipName": req.params.ship,
                        "CruiseBasicData.CruiseID": req.params.id }).then(function() {
          fastify.log.info("Remove CSR: " + req.params.ship + "/" + req.params.id)
          reply.code(204)
        }).catch(function(err){
          fastify.log.error(err)
          reply.code(500).send(JSON.stringify({"Error": err}))
        })
      //} catch(err) {
      //  fastify.log.error(err)
      //}
    })

    const MultiDelHandler = async (req, reply, DateOp="CruiseBasicData.StartDate") => {
      const qstr = req.query
      let qry, startq={}, endq={}, itemx

      if (typeof qstr.ship === 'undefined' || qstr.ship.trim() === '' || qstr.ship.trim() === '*') {
        let err = "Wrong ship name: " + qstr.ship + ', can only one ship at one time of deletion'
        fastify.log.info(err)
        reply.code(400).send(JSON.stringify({"Error": err}))
        return
      } //else {
        //itemx = uncaseArrMatch(qstr.ship, false, true, false, true, false, false)
      qry = {"CruiseBasicData.ShipName": qstr.ship.trim()}
      //}
      //Note: == uncaseArrMatch(qstr, strmode=false, regex=true, fuzzy=false, wildcard=false, dot=false, dash=false) ==
      itemx = uncaseArrMatch(req.params.start, true, false, false, false, false, false)
      let startd = Date.parse(itemx), endd
      if (!isNaN(startd)) {
        startd = new Date(itemx) //(+new Date(itemx)  + 8 * 3600 * 1000) //.toISOString()
        startq[DateOp] = { $gte: startd }
      } else {
        let err = "Wrong start date: " + req.params.start
        fastify.log.info(err)
        reply.code(400).send(JSON.stringify({"Error": err}))
        return
      }

      endq[DateOp] = { $lte: startd } //if not specify end, then only delete one record: $gte = $lte = startd
      if (typeof qstr.end !== 'undefined') {
        itemx = uncaseArrMatch(qstr.end, true, false, false, false, false, false)
        endd = Date.parse(itemx)
        if (!isNaN(endd)) {
          //if (itemx.indexOf(":") >= 0) {
          endd = new Date(itemx) //(+new Date(itemx) + 8 * 3600 * 1000)
          //} else {
          //  endd = new Date(+new Date(itemx + ' ' + '23:59:59')  + 8 * 3600 * 1000) //.toISOString()
          //}
          endq[DateOp] = { $lte: endd }
        }
      }
      qry = {...qry, $and:[startq, endq]}
      //try {
        CSR.deleteMany(qry).then(function() {
          fastify.log.info("Remove CSR: " + JSON.stringify(qry))
          reply.code(204)
        }).catch(function(err){
          fastify.log.error(err)
          reply.code(500).send(JSON.stringify({"Error": err}))
        })
      //} catch(err) {
      //  fastify.log.error(err)
      //  reply.code(400).send(JSON.stringify({"Error": err}))
      //}
    }

    const csrDelAfterSchemaObj = (DateOp="Cruise StartDate") => ({
      type: 'object',
      properties: {
        start: { type: 'string', description: `Delete records after ${DateOp} in CSR`}
      },
      required: ['start']
    })

    const csrMulDelSchemaObj = {
      type: 'object',
      required:['ship'],
      properties: {
        ship: { type: 'string', description: 'Ship name in CSR, can only one ship at one time of deletion' },
        end: { type: 'string', description: 'Optional. But if not specified, force end=start, i.e. it delete only one record'  },
      }
    }

    fastify.delete('/start/:start', {
      schema: {
        description: 'Delete all CSR data after given Cruise StartDate',
        tags: ['CSR'],
        params: csrDelAfterSchemaObj('Cruise StartDate'),
        query: csrMulDelSchemaObj,
        response: 204
      }
    }, async function(req, reply) {
      MultiDelHandler(req, reply, "CruiseBasicData.StartDate")
    })

    fastify.delete('/updated/:start', {
      schema: {
        description: 'Delete all CSR data after given UpdatedAt date of database',
        tags: ['CSR'],
        params: csrDelAfterSchemaObj('data updatedAt time'),
        query: csrMulDelSchemaObj,
        response: 204
      }
    }, async function(req, reply) {
      MultiDelHandler(req, reply, "updatedAt")
    })

  next()
}
