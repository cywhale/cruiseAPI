import assert from 'node:assert/strict'
import fs from 'node:fs'
import { parse } from 'arraybuffer-xml-parser'
import { normalizeCSRInstruments } from '../src/module/csrInstrumentNormalizer.mjs'

const xmlPath = new URL('../data/NEW_NOR1_T050_CSR_20260312_051210.xml', import.meta.url)
const xml = fs.readFileSync(xmlPath, 'utf8')
const parsed = parse(xml, { arrayMode: false, dynamicTypingNodeValue: false })
const data = parsed.CruiseReport

assert.ok(data, 'CruiseReport should exist')

normalizeCSRInstruments(data)

assert.ok(data.ShipboardInstrument, 'ShipboardInstrument should be normalized')
assert.ok(data.NonshipboardInstrument, 'NonshipboardInstrument should be normalized')

assert.ok(Array.isArray(data.ShipboardInstrument.items), 'ShipboardInstrument.items should be an array')
assert.ok(Array.isArray(data.NonshipboardInstrument.items), 'NonshipboardInstrument.items should be an array')

assert.equal(data.ShipboardInstrument.items.length, 38, 'ShipboardInstrument.items count mismatch')
assert.equal(data.NonshipboardInstrument.items.length, 40, 'NonshipboardInstrument.items count mismatch')

assert.deepEqual(
  data.ShipboardInstrument.items[0],
  {
    key: 'ctd_sbe911',
    value: '溫鹽深儀CTD(SBE 911plus &amp; SBE 3plus &amp; SBE 4C &amp; SBE 5T)',
    checkValue: '正常'
  },
  'First shipboard instrument item mismatch'
)

assert.deepEqual(
  data.NonshipboardInstrument.items[0],
  {
    key: 'shipek',
    value: '旋轉式採泥器(Wildco Shipek)',
    checkValue: '未使用'
  },
  'First nonshipboard instrument item mismatch'
)

assert.equal(
  data.ShipboardInstrument.MalfunctionDescription,
  '1.ADCP75K資料異常',
  'ShipboardInstrument.MalfunctionDescription mismatch'
)

assert.equal(
  data.ShipboardInstrument.ProcessingDescription,
  '1.通知貴儀技術員',
  'ShipboardInstrument.ProcessingDescription mismatch'
)

assert.equal(
  data.NonshipboardInstrument.MalfunctionDescription,
  undefined,
  'NonshipboardInstrument should not include MalfunctionDescription'
)

assert.equal(
  data.NonshipboardInstrument.ProcessingDescription,
  undefined,
  'NonshipboardInstrument should not include ProcessingDescription'
)

console.log('CSR instrument normalization verification passed.')
