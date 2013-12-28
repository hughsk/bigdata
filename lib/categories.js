var createCategory = require('./category')
var uniq = require('uniq')
var url = require('url')

module.exports = function(store) {
  function make(name, cb) {
    return createCategory(store.sublevel(name), cb)
  }

  make.counter = function makeCounter(name, cb) {
    return createCategory.counter(store.sublevel(name), cb)
  }

  return {
    users: make('users', function(data) {
      return data.maintainers
        && data.maintainers[0]
        && data.maintainers[0].name
    }),

    hosts: make('hosts', function(data) {
      var t, r = data.repository
        && data.repository.url
        &&(t = url.parse(data.repository.url))
        && t.hostname

      return r
    }, true),

    licenses: make('licenses', function(data) {
      data = data.versions[data['dist-tags'].latest]
      var license = data.license || data.licenses
      if (!license) return false
      if (Array.isArray(license)) license = license && license[0]
      if (typeof license !== 'string') license = license && license.type
      if (!license) return false
      license = String(license).toUpperCase().trim()
      return license
    }),

    dependencies: make.counter('dependencies', function(data) {
      data = data.versions[data['dist-tags'].latest]
      data = Object.keys(data.dependencies || {}).concat(Object.keys(data.devDependencies || {}))
      data = uniq(data)
      return data.length
    })
  }
}

