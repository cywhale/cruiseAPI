import mongoose from 'mongoose'
const { Schema } = mongoose

import { loadType } from './Int32.mjs'
import moduleFactory from 'mongoose-schema-jsonschema'

const Integer = loadType(mongoose)
moduleFactory(mongoose) //https://github.com/DScheglov/mongoose-schema-jsonschema

const csrBasicSchema = new Schema({
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
}, { _id : false })

const csrUserSchema = new Schema({
      Department: [{type: String}],
      Name: [{type: String}]
}, { required: false, _id : false })

const csrItemSchema = new Schema({
      Item: [{type: String}],
      CollectionNum: [{type: Integer}],
      CollectionOwner: [{type: String}],
      ReasonChecked: [{type: Integer}],
      Reason: [{type: String}]
}, { required: false, _id : false })

const csrFieldSchema = new Schema({
      Equipment: [{type: String}],
      Summary1: [{type: String}],
      Summary2: [{type: String}],
      DataOwner: [{type: String}]
}, { required: false, _id : false })

const csrSchema = new Schema({
    CruiseBasicData: csrBasicSchema,
    Participants: csrUserSchema,
    CruiseData: csrItemSchema,
    Physical: csrFieldSchema,
    Biogeochemical: csrFieldSchema,
    Biology: csrFieldSchema,
    Geology: csrFieldSchema,
    Geophysics: csrFieldSchema,
    Atmosphere: csrFieldSchema,
    Other: csrFieldSchema
}, { timestamps: true })

//const CSR = mongoose.model('csr', crdataSchema, 'csr')
//export default CSR
export const csrJsonSchema = csrSchema.jsonSchema()
export default csrSchema
//console.dir(csrJsonSchema, { depth: null })
