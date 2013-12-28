var combine = require('stream-combiner')
var through2 = require('through2')
var tab = require('tab64')

module.exports = createCategory
module.exports.counter = createCounter

function createCounter(store, counter) {
  return { stringify: stringify, preprocess: preprocess, type: 'counter' }

  function stringify(size) {
    var index = new Float32Array(size)
    var id = 0

    index.check = check
    index.encode = encode
    return index

    function check(data, next) {
      index[id++] = Number(counter(data))
      next()
    }

    function encode() {
      return new Buffer('"' +
        tab.encode(index).replace(/\s+/g, '')
      + '"')
    }
  }

  function preprocess() {
    return { data: function(){}, end: function(cb){cb()} }
  }
}

function createCategory(store, qualifier) {
  return { stringify: stringify, preprocess: preprocess, type: 'category' }

  function stringify(size) {
    var index = new Uint32Array(size)
    var id = 0

    index.check = check
    index.encode = encode
    return index

    function check(data, next) {
      var tid = id++
      store.get(qualifier(data), function(err, n) {
        index[tid] = +parseInt(n, 10)|0
        next()
      })
    }

    function encode() {
      return new Buffer('"' +
        tab.encode(index).replace(/\s+/g, '')
      + '"')
    }
  }

  function preprocess() {
    return { data: write, end: end }

    function write(data) {
      var key = qualifier(data)
      if (key) return store.put(key, ' ')
    }

    function end(complete) {
      var id = 0

      combine(store.createKeyStream()
        , through2(function(key, _, next) {
          store.put(key, String(id++), next)
        })
      ).once('end', complete)
    }
  }
}
