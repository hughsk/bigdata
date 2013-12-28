var tab = require('tab64')
var xhr = require('xhr')

xhr('data.json', function(err, res, body) {
  if (err) throw err
  console.time('found voxel modules')
  body = JSON.parse(body)

  var packages = body.packages
  var licenses = body.licenses
  var users    = body.users
  var hosts    = body.hosts

  var package_dependencies = tab.decode(body.package_dependencies, 'float32')
  var package_licenses     = tab.decode(body.package_licenses, 'int32')
  var package_users        = tab.decode(body.package_users, 'int32')
  var package_hosts        = tab.decode(body.package_hosts, 'int32')

  var query = 'voxel'

  for (var i = 0, p; i < packages.length; i += 1) {
    if ((p = packages[i]).indexOf(query)) continue

    console.log({
        name: p
      , dependencies: package_dependencies[i]
      , licenses: licenses[package_licenses[i]]
      , users: users[package_users[i]]
      , hosts: hosts[package_hosts[i]]
    })
  }

  console.timeEnd('found voxel modules')
})
