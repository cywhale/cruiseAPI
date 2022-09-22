import mongoose from 'mongoose'
const { Schema } = mongoose

import { loadType } from './Int32.mjs'
import moduleFactory from 'mongoose-schema-jsonschema'

const Integer = loadType(mongoose)
moduleFactory(mongoose) //https://github.com/DScheglov/mongoose-schema-jsonschema

const crBasicSchema = new Schema({
      ShipName: { type: String, required: true },
      CruiseID: { type: String, required: true },
      LeaderName: { type: String, required: true },
      ExploreOcean: String,
      FarestDistance: { type: Integer },
      TotalDistance: { type: Integer },
      FuelConsumption: { type: Integer },
      StartDate: { type: Date, required: true },
      EndDate: { type: Date, required: true },
      StartPort: String,
      EndPort: String,
      DurationDays: { type: Integer },
      DurationHours: { type: Integer },
      PlanName: String,
      Technician: String,
      Remark: String
})

const crUserSchema = new Schema({
      Department: [{type: String}],
      Name: [{type: String}]
})

const crItemSchema = new Schema({
      Item: [{type: String}],
      CollectionNum: [{type: Integer}],
      CollectionOwner: [{type: String}],
      ReasonChecked: [{type: Integer}],
      Reason: [{type: String}]
})

const crFieldSchema = new Schema({
      Equipment: [{type: String}],
      Summary1: [{type: String}],
      Summary2: [{type: String}],
      DataOwner: [{type: String}]
})

const crdataSchema = new Schema({
    CruiseBasicData: crBasicSchema,
    Participants: crUserSchema,
    CruiseData: crItemSchema,
    Physical: crFieldSchema,
    Biogeochemical: crFieldSchema,
    Biology: crFieldSchema,
    Geology: crFieldSchema,
    Geophysics: crFieldSchema,
    Atmospher: crFieldSchema,
    Other: crFieldSchema
}, { timestamps: true })

//const CRdata = mongoose.model('crdata', crdataSchema, 'crdata')
//export default CRdata
export const crdataJsonSchema = crdataSchema.jsonSchema()
export default crdataSchema
//console.dir(crdataJsonSchema, { depth: null })
