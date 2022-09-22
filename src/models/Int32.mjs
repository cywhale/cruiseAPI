'use strict'
//Credits: vkarpov15/mongoose-int32 (github)
//Code from https://github.com/vkarpov15/mongoose-int32/blob/master/int32.js
import mongoose from 'mongoose'
//import fp from 'fastify-plugin'
//function int32Plugin (fastify, opts, done) {

const INT32_MAX = 0x7FFFFFFF;
const INT32_MIN = -0x80000000;

class Integer extends mongoose.SchemaType {
  constructor(key, options) {
    super(key, options, 'Integer')
  }

  /**
   * Cast the given value to something that MongoDB will store as int32
   *
   * @param {any} val
   * @return {Number}
   */
  cast(val) {
    if (val == null) {
      return val
    }

    var _val = Number(val)
    if (isNaN(_val)) {
      var msg = val + ' is not a number'
      throw new mongoose.Error(msg)
    }
    _val = Math.round(_val)
    if (_val < INT32_MIN || _val > INT32_MAX) {
      var msg = val +
        ' is outside of the range of valid BSON int32s: ' + INT32_MAX + ' - ' +
        INT32_MIN
      throw new mongoose.Error(msg)
    }
    return _val
  }
}

Integer.prototype.$conditionalHandlers =
  mongoose.Schema.Types.Number.prototype.$conditionalHandlers

Integer.INT32_BSON_TYPE = 16
Integer.INT32_MAX = INT32_MAX
Integer.INT32_MIN = INT32_MIN

Integer.instance = 'Integer'

//module.exports = Integer
export function loadType(mongoose) {
  //if (mongoose == null) {
  //  mongoose = require('mongoose');
  //}
  if (mongoose.Schema && typeof mongoose.Schema.Types === 'object') {
	  mongoose.Schema.Types.Integer = Integer
  }

  if (typeof mongoose.SchemaTypes === 'object') {
	  mongoose.SchemaTypes.Integer = Integer
  }

  if (typeof mongoose.Types === 'object') {
	  mongoose.Types.Integer = Integer
  }

  return Integer
}
//fastify.decorate('loadType_int32', loadType)
//done()
//}
//export default fp(int32Plugin, {
//  name: 'int32'
//})
export default Integer
