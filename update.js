var metadata = require('npm-metadata-raw')
var keyCount = require('level-key-count')
var sublevel = require('level-sublevel')
var combine = require('stream-combiner')
var through2 = require('through2')
var stats = require('npm-stats')()
var json = require('JSONStream')
var async = require('async')
var level = require('level')
var tab = require('tab64')
var fs = require('fs')
var wrap = require('wrap-stream')

var boot = require('./lib/boot')

var objectmode = {}

var db = sublevel(level(__dirname + '/.data'))
var meta = metadata(db)
var categories = require('./lib/categories')(meta)

boot(meta, function(err) {
  if (err) throw err

  var moduleCount = null
  var output = combine(wrap('{', '}'), fs.createWriteStream(__dirname + '/data.json'))

  var firstKey = true
  function addRawKey(key, value) {
    output.write(firstKey ? '' : ',')
    output.write('"'+key+'":')
    output.write(value)
    firstKey = false
  }

  function addStreamKey(key, stream, done) {
    output.write(firstKey ? '' : ',')
    output.write('"'+key+'":')
    stream.once('end', done).pipe(output, { end: false })
    firstKey = false
  }

  keyCount(meta, function(err, _count) {
    if (err) throw err
    moduleCount = _count
    generateIndexes(function(err) {
      if (err) throw err
      output.end()
    })
  })

  function generateIndexes(done) {
    var cats = Object.keys(categories).map(function(key) {
      var data  = categories[key].stringify(moduleCount)
      data.type = categories[key].type
      data.key = key
      data.assoc_key = 'package_' + key
      return data
    })

    combine(
        meta.createValueStream()
      , through2(objectmode, function(data, _, next) {
          data = JSON.parse(data)

          async.mapSeries(cats, function(category, checked) {
            category.check(data, checked)
          }, function(err) {
            next(err)
          })
        })
    ).once('end', function() {
      for (var i = 0; i < cats.length; i += 1) {
        addRawKey(cats[i].assoc_key, cats[i].encode())
      }

      addStreamKey('packages', combine(
          meta.createKeyStream()
        , json.stringify('[',',',']')
      ), function(err) {
        if (err) throw err

        async.mapSeries(cats, function(data, next) {
          if (data.type === 'counter') return next()
          addStreamKey(data.key, combine(
              meta.sublevel(data.key).createKeyStream()
            , json.stringify('[',',',']')
          ), next)
        }, done)
      })
    })
  }
})
