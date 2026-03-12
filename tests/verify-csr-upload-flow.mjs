import assert from 'node:assert/strict'
import fs from 'node:fs'
import Fastify from 'fastify'
import mongoose from 'mongoose'
import csrSchema from '../src/models/csrSchema.mjs'
import xmlHandler from '../src/plugins/xmlHandler.mjs'

const xmlPath = new URL('../data/NEW_NOR1_T050_CSR_20260312_051210.xml', import.meta.url)
const xmlBuffer = fs.readFileSync(xmlPath)

const fastify = Fastify({ logger: false })
await fastify.register(xmlHandler)

const part = {
  filename: 'NEW_NOR1_T050_CSR_20260312_051210.xml',
  async toBuffer () {
    return xmlBuffer
  }
}

await fastify.onFile(part)

assert.ok(part.value, 'Parsed upload payload should exist')

const modelName = `csr_upload_validation_${Date.now()}`
const CSRValidation = mongoose.model(modelName, csrSchema)
const doc = new CSRValidation(part.value)

await doc.validate()

const output = doc.toObject({ depopulate: true })

assert.equal(output.CruiseBasicData.ShipName, 'NOR1', 'ShipName mismatch after upload parsing')
assert.equal(output.CruiseBasicData.CruiseID, 'T050', 'CruiseID mismatch after upload parsing')
assert.equal(
  output.CruiseBasicData.StartDate.toISOString(),
  '2026-03-10T02:00:00.000Z',
  'StartDate mismatch after upload parsing'
)
assert.equal(
  output.CruiseBasicData.EndDate.toISOString(),
  '2026-03-12T04:05:00.000Z',
  'EndDate mismatch after upload parsing'
)

assert.ok(output.ShipboardInstrument, 'ShipboardInstrument should exist after upload parsing')
assert.ok(output.NonshipboardInstrument, 'NonshipboardInstrument should exist after upload parsing')
assert.equal(output.ShipboardInstrument.items.length, 38, 'Shipboard instrument count mismatch')
assert.equal(output.NonshipboardInstrument.items.length, 40, 'Nonshipboard instrument count mismatch')
assert.equal(
  output.ShipboardInstrument.MalfunctionDescription,
  '1.ADCP75K資料異常',
  'MalfunctionDescription mismatch after upload parsing'
)
assert.equal(
  output.ShipboardInstrument.ProcessingDescription,
  '1.通知貴儀技術員',
  'ProcessingDescription mismatch after upload parsing'
)
assert.equal(
  output.NonshipboardInstrument.MalfunctionDescription,
  undefined,
  'NonshipboardInstrument should not contain MalfunctionDescription'
)

mongoose.deleteModel(modelName)
await fastify.close()

console.log('CSR upload flow verification passed.')
