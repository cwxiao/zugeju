const ongoingItems = [
  {
    id: 'boardgame-night',
    tag: '进行中',
    title: '今晚桌游',
    mode: '线下',
    time: '今天 20:00',
    place: '南山 Coffee Lab',
    status: '还差 1 人',
    count: '3 / 4',
    members: ['阿泽', '小江', 'M'],
    note: '先到的人占大桌，想喝什么可以先点。',
    checklist: ['带上一点零食', '提前十分钟到', '到了在群里发定位']
  },
  {
    id: 'movie-plan',
    tag: '已确认',
    title: '周六电影',
    mode: '线下',
    time: '周六 19:30',
    place: '万象城 IMAX',
    status: '3 人已到齐',
    count: '3 / 3',
    members: ['林', 'Q', '77'],
    note: '提前 20 分钟到，票先统一买。',
    checklist: ['确认场次时间', '到场后统一取票', '散场后再决定要不要去吃点']
  }
]

function getOngoingItem(id) {
  return ongoingItems.find((item) => item.id === id)
}

module.exports = {
  ongoingItems,
  getOngoingItem
}