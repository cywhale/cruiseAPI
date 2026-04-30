import assert from 'node:assert/strict'
import {
  formatCSRDateFieldsForOutput,
  formatDateWithOffset,
  parseTimezoneOffset
} from '../src/module/timezoneFormatter.mjs'

assert.equal(parseTimezoneOffset(undefined), null, 'undefined tz should keep default output')
assert.equal(parseTimezoneOffset('8'), 480, 'numeric hour offset should parse')
assert.equal(parseTimezoneOffset('+08:00'), 480, '+08:00 offset should parse')
assert.equal(parseTimezoneOffset('08:00'), 480, 'unsigned hh:mm offset should parse')
assert.equal(parseTimezoneOffset('-05:30'), -330, '-05:30 offset should parse')
assert.equal(parseTimezoneOffset('15'), undefined, 'out-of-range offset should be invalid')
assert.equal(parseTimezoneOffset('bad'), undefined, 'invalid offset should be rejected')

const utcDate = '2026-04-29T02:11:25.107Z'
assert.equal(
  formatDateWithOffset(utcDate, 480),
  '2026-04-29T10:11:25.107+08:00',
  'UTC+8 formatted date mismatch'
)
assert.equal(
  formatDateWithOffset(utcDate, -330),
  '2026-04-28T20:41:25.107-05:30',
  'UTC-5:30 formatted date mismatch'
)

const data = [{
  CruiseBasicData: {
    ShipName: 'NOR1',
    CruiseID: 'T050',
    StartDate: new Date('2026-04-29T02:11:25.107Z'),
    EndDate: new Date('2026-04-29T03:11:25.107Z')
  },
  Participants: {
    Name: ['Example']
  }
}]

const converted = formatCSRDateFieldsForOutput(data, 480)
assert.equal(
  converted[0].CruiseBasicData.StartDate,
  '2026-04-29T10:11:25.107+08:00',
  'StartDate should be converted for output'
)
assert.equal(
  converted[0].CruiseBasicData.EndDate,
  '2026-04-29T11:11:25.107+08:00',
  'EndDate should be converted for output'
)
assert.deepEqual(data[0].Participants, { Name: ['Example'] }, 'non-date fields should be preserved')

console.log('Timezone formatter verification passed.')
