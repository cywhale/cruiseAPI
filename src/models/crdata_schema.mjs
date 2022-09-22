
import mongoose from 'mongoose'
const { Schema } = mongoose
import { loadType } from './Int32.mjs'

const Int32 = loadType(mongoose)

const crBasicSchema = new Schema({
      ShipName: { type: String, required: true },
      CruiseID: { type: String, required: true },
      LeaderName: { type: String, required: true },
      ExploreOcean: String,
      FarestDistance: { type: Int32 },
      TotalDistance: { type: Int32 },
      FuelConsumption: { type: Int32 },
      StartDate: { type: Date, required: true },
      EndDate: { type: Date, required: true },
      StartPort: String,
      EndPort: String,
      DurationDays: { type: Int32 },
      DurationHours: { type: Int32 },
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
      CollectionNum: [{type: Int32}],
      CollectionOwner: [{type: String}],
      ReasonChecked: [{type: Int32}],
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
})

const CRdata = mongoose.model('crdata', crdataSchema, 'crdata')
export default CRdata

