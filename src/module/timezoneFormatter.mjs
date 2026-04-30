const pad = (value, width = 2) => value.toString().padStart(width, '0')

export const parseTimezoneOffset = (value) => {
  if (value === undefined || value === null || value === '') return null

  const raw = value.toString().trim()
  const match = raw.match(/^([+-])?(\d{1,2})(?::?([0-5]\d))?$/)
  if (!match) return undefined

  const sign = match[1] === '-' ? -1 : 1
  const hours = Number.parseInt(match[2], 10)
  const minutes = Number.parseInt(match[3] ?? '0', 10)

  if (hours > 14 || (hours === 14 && minutes > 0)) return undefined

  return sign * (hours * 60 + minutes)
}

export const formatDateWithOffset = (value, offsetMinutes = 0) => {
  if (value === undefined || value === null || value === '') return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const shifted = new Date(date.getTime() + offsetMinutes * 60 * 1000)
  const sign = offsetMinutes < 0 ? '-' : '+'
  const absOffset = Math.abs(offsetMinutes)
  const offset = `${sign}${pad(Math.floor(absOffset / 60))}:${pad(absOffset % 60)}`

  return [
    shifted.getUTCFullYear(),
    '-',
    pad(shifted.getUTCMonth() + 1),
    '-',
    pad(shifted.getUTCDate()),
    'T',
    pad(shifted.getUTCHours()),
    ':',
    pad(shifted.getUTCMinutes()),
    ':',
    pad(shifted.getUTCSeconds()),
    '.',
    pad(shifted.getUTCMilliseconds(), 3),
    offset
  ].join('')
}

export const formatCSRDateFields = (record, offsetMinutes) => {
  if (offsetMinutes === null || offsetMinutes === undefined) return record

  const output = typeof record.toObject === 'function'
    ? record.toObject({ depopulate: true })
    : { ...record }

  if (!output.CruiseBasicData) return output

  output.CruiseBasicData = { ...output.CruiseBasicData }
  output.CruiseBasicData.StartDate = formatDateWithOffset(output.CruiseBasicData.StartDate, offsetMinutes)
  output.CruiseBasicData.EndDate = formatDateWithOffset(output.CruiseBasicData.EndDate, offsetMinutes)

  return output
}

export const formatCSRDateFieldsForOutput = (data, offsetMinutes) => {
  if (offsetMinutes === null || offsetMinutes === undefined) return data
  return data.map((record) => formatCSRDateFields(record, offsetMinutes))
}
