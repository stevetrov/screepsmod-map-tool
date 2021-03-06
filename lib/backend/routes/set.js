const path = require('path')
const map = require(path.join(path.dirname(require.main.filename), '../lib/cli/map'))
const { json } = require('micro')

module.exports.POST = async function (req, res) {
  const { config: { common: { storage: { db } } } } = req
  let rooms = await json(req)
  let ps = rooms.map(async ({ terrain, room, objects, status = 'out of bounds', bus, openTime, sourceKeepers, novice, respawnArea }) => {
    await db.rooms.update({ _id: room }, { $set: { name: room, active: true, status, bus, openTime, sourceKeepers, novice, respawnArea } }, { upsert: true })
    await db['rooms.terrain'].update({ room }, { $set: { terrain } }, { upsert: true })
    await map.updateRoomImageAssets(room)
    await db['rooms.objects'].removeWhere({ room })
    await objects.map(o => db['rooms.objects'].insert(o))
  })
  let ret = await Promise.all(ps)
  map.updateTerrainData()
  return ret
}
