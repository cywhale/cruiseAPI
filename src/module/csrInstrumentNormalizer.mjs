const asArray = (value) => {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

const cleanText = (value) => {
  if (value === undefined || value === null) return undefined
  return value.toString().trim()
}

const normalizeInstrumentItem = (item) => {
  if (!item || typeof item !== 'object') return null

  const key = cleanText(item.key ?? item.Key)
  const value = cleanText(item.value ?? item.Value)
  const checkValue = cleanText(item.checkValue ?? item.CheckValue)

  if (!key && !value && !checkValue) return null

  const normalized = {}
  if (key) normalized.key = key
  if (value) normalized.value = value
  if (checkValue) normalized.checkValue = checkValue
  return normalized
}

const normalizeInstrumentItems = (block) => {
  if (!block || typeof block !== 'object') return []

  if (Array.isArray(block.items)) {
    return block.items
      .map(normalizeInstrumentItem)
      .filter(Boolean)
  }

  const keys = asArray(block.Key)
  const values = asArray(block.Value)
  const checkValues = asArray(block.CheckValue)
  const length = Math.max(keys.length, values.length, checkValues.length)
  const items = []

  for (let index = 0; index < length; index += 1) {
    const item = normalizeInstrumentItem({
      Key: keys[index],
      Value: values[index],
      CheckValue: checkValues[index]
    })
    if (item) items.push(item)
  }

  return items
}

const normalizeInstrumentBlock = (block, withDescriptions = false) => {
  if (!block || typeof block !== 'object') return undefined

  const items = normalizeInstrumentItems(block)
  const normalized = {}
  if (items.length > 0) {
    normalized.items = items
  }

  if (withDescriptions) {
    const malfunction = cleanText(block.MalfunctionDescription)
    const processing = cleanText(block.ProcessingDescription)
    if (malfunction) normalized.MalfunctionDescription = malfunction
    if (processing) normalized.ProcessingDescription = processing
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

export const normalizeCSRInstruments = (data) => {
  if (!data || typeof data !== 'object') return data

  const shipboard = normalizeInstrumentBlock(data.ShipboardInstrument, true)
  const nonshipboard = normalizeInstrumentBlock(data.NonshipboardInstrument, false)

  if (shipboard) {
    data.ShipboardInstrument = shipboard
  } else {
    delete data.ShipboardInstrument
  }

  if (nonshipboard) {
    data.NonshipboardInstrument = nonshipboard
  } else {
    delete data.NonshipboardInstrument
  }

  return data
}
