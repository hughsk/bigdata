var combine = require('stream-combiner')
var Progress = require('progress')
var through2 = require('through2')
var stats = require('npm-stats')()
var async = require('map-async')
var clear = require('clear')


var objectmode = { objectMode: true }

module.exports = boot

function boot(meta, complete) {
  var categories

  categories = require('./categories')(meta)
  categories = Object.keys(categories).map(function(key) {
    return categories[key].preprocess()
  })

  var c = categories.length
  var found = 0
  var mod = 0
  var bar

  clear()
  console.log('getting module list...')
  meta.sync().on('found', function() {
    found += 1
  }).on('data', function(data) {
    for (var i = 0; i < c; i += 1) {
      categories[i].data(data)
    }

    if (mod++ % 5) return
    if (!bar) bar = createBar(found)

    bar.tick(5)
  }).once('end', function() {
    async(categories, function(cat, i, next) {
      cat.end(next)
    }, complete)
  })
}

function createBar(total) {
  console.log('getting data:')
  return new Progress(':current/:total [:bar] :percent ETA: :etas', {
      complete: '#'
    , incomplete: ' '
    , width: 55
    , total: total
  })
}

function percent(value) {
  return (value * 100).toFixed(3) + '%'
}
