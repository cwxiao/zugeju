const SEED_ACTIVITY_RECORDS = [
  {
    id: 'archive-1',
    title: '深夜峡谷五黑',
    typeName: '电竞',
    role: 'created',
    status: 'finished',
    mode: 'online',
    startTime: '2026-05-28T22:40',
    roleTime: '2026-05-26T23:10',
    place: '线上语音房',
    joinedCount: 5,
    maxParticipantCount: 5,
    inviteCount: 8,
    totalAmountFen: 0,
    settlementLabel: '线上开黑，无需结算',
    highlight: '连赢三把之后临时加开到了凌晨一点。',
    overview: '从组局到满人只用了 17 分钟，典型的临时起意高响应活动。'
  },
  {
    id: 'archive-2',
    title: '周五桌游夜',
    typeName: '桌游',
    role: 'created',
    status: 'finished',
    mode: 'offline',
    startTime: '2026-05-24T21:20',
    roleTime: '2026-05-21T20:15',
    place: '万象城 7 楼桌游吧',
    joinedCount: 6,
    maxParticipantCount: 6,
    inviteCount: 6,
    totalAmountFen: 46800,
    settlementLabel: 'AA 已结清',
    highlight: '狼人杀一路拖到最后一轮，散场时已经接近地铁末班。',
    overview: '全员到齐，整场节奏稳定，属于复购概率很高的一类局。'
  },
  {
    id: 'archive-3',
    title: '烧烤加奶茶局',
    typeName: '聚餐',
    role: 'joined',
    status: 'finished',
    mode: 'offline',
    startTime: '2026-05-22T22:10',
    roleTime: '2026-05-22T19:05',
    place: '新天地夜市',
    joinedCount: 4,
    maxParticipantCount: 6,
    inviteCount: 3,
    totalAmountFen: 35200,
    settlementLabel: 'AA 已结清',
    highlight: '本来只是吃夜宵，最后又顺手续了第二摊。',
    overview: '虽然人数没满，但互动密度很高，典型的临场加码型饭局。'
  },
  {
    id: 'archive-4',
    title: '夜跑补氧小队',
    typeName: '运动',
    role: 'joined',
    status: 'finished',
    mode: 'offline',
    startTime: '2026-05-19T22:30',
    roleTime: '2026-05-18T18:30',
    place: '滨江绿道',
    joinedCount: 3,
    maxParticipantCount: 5,
    inviteCount: 2,
    totalAmountFen: 0,
    settlementLabel: '纯运动，无需结算',
    highlight: '跑完又在江边坐了半小时，局虽小但聊得很透。',
    overview: '活动规模偏小，但参与者黏性强，很适合作为关系升温局。'
  },
  {
    id: 'archive-5',
    title: 'K歌续摊局',
    typeName: 'K歌',
    role: 'created',
    status: 'ongoing',
    mode: 'offline',
    startTime: '2026-06-02T23:00',
    roleTime: '2026-05-31T21:45',
    place: '星聚会 KTV',
    joinedCount: 5,
    maxParticipantCount: 8,
    inviteCount: 7,
    totalAmountFen: 0,
    settlementLabel: '还没开唱，等结束再算',
    highlight: '已经有 5 个人答应来，剩下名额还在拉人。',
    overview: '这是当前档期里转化最快的一场，延续了你夜场开局的稳定号召力。'
  },
  {
    id: 'archive-6',
    title: '午夜电影补番',
    typeName: '电影',
    role: 'joined',
    status: 'finished',
    mode: 'offline',
    startTime: '2026-05-14T23:25',
    roleTime: '2026-05-14T18:12',
    place: 'IMAX 影城',
    joinedCount: 4,
    maxParticipantCount: 4,
    inviteCount: 1,
    totalAmountFen: 19600,
    settlementLabel: '票钱已平摊',
    highlight: '结束后又转场吃了宵夜，活动时长远超预期。',
    overview: '你在这种慢热型活动里更像气氛推进器，而不是纯跟车党。'
  },
  {
    id: 'archive-7',
    title: '周末火锅回血局',
    typeName: '聚餐',
    role: 'joined',
    status: 'finished',
    mode: 'offline',
    startTime: '2026-05-10T21:50',
    roleTime: '2026-05-09T16:00',
    place: '龙湖天街火锅店',
    joinedCount: 7,
    maxParticipantCount: 8,
    inviteCount: 2,
    totalAmountFen: 61200,
    settlementLabel: 'AA 已结清',
    highlight: '到场人数接近满编，最后靠你现场控场把座位安排顺了。',
    overview: '你虽然不是发起人，但在大桌局里有明显的组织补位能力。'
  }
]

function getActivityArchiveRecords() {
  return SEED_ACTIVITY_RECORDS.map(normalizeRecord)
}

function buildPersonalityReport(records, nickname) {
  const safeNickname = nickname || '你'
  const normalized = (records || []).map(normalizeRecord)
  const createdRecords = normalized.filter((item) => item.role === 'created')
  const joinedRecords = normalized.filter((item) => item.role === 'joined')
  const inviteCount = normalized.reduce((sum, item) => sum + item.inviteCount, 0)
  const streakDays = Math.min(21, 6 + normalized.length * 2)
  const rawScore = createdRecords.length * 5 + joinedRecords.length * 3 + inviteCount * 2 + streakDays
  const score = Math.min(99, Math.round(rawScore * 0.25 + 50))
  const surpassPercent = Math.min(99, Math.max(71, score + 8))
  const categoryStats = buildCategoryStats(normalized)
  const nightPercent = calculateNightPercent(normalized)
  const title = resolveTitle(normalized, categoryStats, nightPercent)
  const socialProfile = resolveSocialProfile(createdRecords.length, joinedRecords.length, inviteCount, normalized.length)
  const animalProfile = resolveAnimalProfile(title.key, socialProfile.key, nightPercent, inviteCount)
  const summaryStats = [
    { label: '发起活动', value: `${createdRecords.length} 场` },
    { label: '参与活动', value: `${joinedRecords.length} 场` },
    { label: '拉人次数', value: `${inviteCount} 次` },
    { label: '连续活跃', value: `${streakDays} 天` }
  ]

  return {
    nickname: safeNickname,
    periodLabel: '过去 30 天',
    score,
    surpassPercent,
    title: title.name,
    titleReason: title.reason,
    coverHeadline: `${safeNickname} 的活动分析报告`,
    coverCaption: resolveCoverCaption(title.name, score),
    dnaList: categoryStats,
    socialLabel: socialProfile.name,
    socialDescription: socialProfile.description,
    nightPercent,
    summaryStats,
    activityStats: {
      total: normalized.length,
      latestTime: normalized.length ? normalized[0].startText : '最近还没开局',
      favoriteCategory: categoryStats.length ? categoryStats[0].name : '随缘局',
      favoriteCategoryPercent: categoryStats.length ? categoryStats[0].percent : 0
    },
    sharpComments: buildSharpComments(safeNickname, title.name, nightPercent, categoryStats, inviteCount),
    honors: buildHonors(normalized, createdRecords.length, joinedRecords.length, nightPercent),
    animalName: animalProfile.name,
    animalDescription: animalProfile.description,
    posterTitle: `${title.name} · ${animalProfile.name}`,
    posterText: `${safeNickname} 这 30 天发起 ${createdRecords.length} 场、参与 ${joinedRecords.length} 场，最常出现的主题是 ${categoryStats[0] ? categoryStats[0].name : '整活'}。`,
    shareCallout: buildShareCallout(title.name, createdRecords.length, nightPercent)
  }
}

function normalizeRecord(record) {
  const modeLabel = record.mode === 'online' ? '线上' : '线下'
  const statusLabel = resolveStatusLabel(record.status)
  const roleLabel = record.role === 'created' ? '我发起的' : '我参加的'
  const startText = formatDateTime(record.startTime)
  const roleTimeText = formatDateTime(record.roleTime)

  return {
    id: record.id,
    title: record.title,
    typeName: record.typeName,
    role: record.role,
    roleLabel,
    status: record.status,
    statusLabel,
    mode: record.mode,
    modeLabel,
    startTime: record.startTime,
    startText,
    roleTime: record.roleTime,
    roleTimeText,
    roleTimeLabel: `${record.role === 'created' ? '发起时间' : '参与时间'} ${roleTimeText}`,
    place: record.place,
    joinedCount: record.joinedCount,
    maxParticipantCount: record.maxParticipantCount,
    inviteCount: record.inviteCount,
    totalAmountFen: record.totalAmountFen,
    totalAmountText: record.totalAmountFen ? formatFen(record.totalAmountFen) : '无需结算',
    settlementLabel: record.settlementLabel,
    highlight: record.highlight,
    overview: record.overview,
    keywords: `${record.title}|${record.typeName}|${record.place}|${record.highlight}`.toLowerCase()
  }
}

function buildCategoryStats(records) {
  const total = records.length || 1
  const counter = {}

  records.forEach((item) => {
    counter[item.typeName] = (counter[item.typeName] || 0) + 1
  })

  return Object.keys(counter)
    .map((name) => ({
      name,
      count: counter[name],
      percent: Math.round((counter[name] / total) * 100),
      width: `${Math.max(18, Math.round((counter[name] / total) * 100))}%`
    }))
    .sort((left, right) => right.count - left.count)
}

function calculateNightPercent(records) {
  if (!records.length) {
    return 0
  }

  const nightCount = records.filter((item) => {
    const hour = Number(String(item.startTime).slice(11, 13))
    return hour >= 22 || hour < 5
  }).length

  return Math.round((nightCount / records.length) * 100)
}

function resolveTitle(records, categoryStats, nightPercent) {
  const topCategory = categoryStats[0] ? categoryStats[0].name : ''
  const topCount = categoryStats[0] ? categoryStats[0].count : 0
  const createdCount = records.filter((item) => item.role === 'created').length
  const joinedCount = records.filter((item) => item.role === 'joined').length

  if (nightPercent >= 60) {
    return {
      key: 'night_king',
      name: '深夜整活王',
      reason: `最近 ${nightPercent}% 的活动发生在晚上 10 点以后。`
    }
  }
  if (topCategory === '电竞' && topCount >= 2) {
    return {
      key: 'esports_engine',
      name: '电竞永动机',
      reason: '高频出没在开黑局，属于随叫随到型输出位。'
    }
  }
  if (topCategory === '聚餐' && createdCount >= 2) {
    return {
      key: 'food_engine',
      name: '聚餐发动机',
      reason: '一到饭点就有新局，属于饭桌上的开关型选手。'
    }
  }
  if (createdCount <= 1 && joinedCount <= 2) {
    return {
      key: 'lone_wolf',
      name: '独狼玩家',
      reason: '出手不多，但每次都挑自己真正想去的局。'
    }
  }

  return {
    key: 'social_ceiling',
    name: '社交天花板',
    reason: '不只会到场，还能把场子慢慢热起来。'
  }
}

function resolveSocialProfile(createdCount, joinedCount, inviteCount, total) {
  if (createdCount >= joinedCount + 2) {
    return {
      key: 'organizer',
      name: '组织者',
      description: '你更像活动发动机，擅长先把局支起来，再等人往里进。'
    }
  }
  if (joinedCount >= createdCount + 2) {
    return {
      key: 'follower',
      name: '跟车党',
      description: '你不一定第一个举手，但很会挑局，常常补上最需要的那个人。'
    }
  }
  if (inviteCount >= 20 && total >= 6) {
    return {
      key: 'social_star',
      name: '社牛',
      description: '你不只是能到场，更能让大家迅速进入同一个频道。'
    }
  }

  return {
    key: 'vibe_builder',
    name: '氛围组',
    description: '你不一定抢发言权，但你在场的时候，局一般都会顺很多。'
  }
}

function resolveAnimalProfile(titleKey, socialKey, nightPercent, inviteCount) {
  if (titleKey === 'night_king' && inviteCount >= 20) {
    return {
      name: '哈士奇',
      description: '活跃、热闹、爱拉人，晚上越晚越来劲。'
    }
  }
  if (socialKey === 'organizer') {
    return {
      name: '金毛',
      description: '组织能力强，人缘稳定，适合把陌生人拉成一个局。'
    }
  }
  if (nightPercent <= 30) {
    return {
      name: '猫',
      description: '出现频率不算夸张，但每次都踩在自己最舒服的节奏上。'
    }
  }

  return {
    name: '狼',
    description: '执行力高，选局精准，关键时刻总能自己补上效率。'
  }
}

function buildSharpComments(nickname, title, nightPercent, categoryStats, inviteCount) {
  const topCategory = categoryStats[0] ? categoryStats[0].name : '整活'

  return [
    `${nickname} 的开局风格偏 ${title}，别人刚准备休息，你已经在问“还差几个人”。`,
    `最近最常出现的主题是 ${topCategory}，说明你对“热闹但不空转”的局有稳定偏好。`,
    `夜场占比 ${nightPercent}% ，一共拉了 ${inviteCount} 次人，属于会把群聊从安静拉到有回声的那种人。`
  ]
}

function buildHonors(records, createdCount, joinedCount, nightPercent) {
  const honors = []

  if (nightPercent >= 60) {
    honors.push('夜场出勤奖')
  }
  if (createdCount >= 3) {
    honors.push('组局发电机')
  }
  if (joinedCount >= 3) {
    honors.push('补位救场王')
  }
  if (records.some((item) => item.totalAmountFen >= 50000)) {
    honors.push('大桌控场选手')
  }

  return honors.slice(0, 4)
}

function buildShareCallout(title, createdCount, nightPercent) {
  return `你的称号是 ${title}。最近 30 天发起 ${createdCount} 场活动，夜场占比 ${nightPercent}% 。`
}

function resolveCoverCaption(title, score) {
  if (score >= 90) {
    return `${title} 已就位，这个月的整活火力值相当在线。`
  }
  if (score >= 80) {
    return `${title} 稳定发挥，属于越到周末越容易开局的那类人。`
  }
  return `${title} 正在升温，下一场可能就是你本月代表作。`
}

function resolveStatusLabel(status) {
  if (status === 'ongoing') {
    return '进行中'
  }
  if (status === 'cancelled') {
    return '已取消'
  }
  return '已结束'
}

function formatDateTime(value) {
  if (!value) {
    return '时间待定'
  }

  return String(value).replace('T', ' ').slice(0, 16)
}

function formatFen(amountFen) {
  return `${(amountFen / 100).toFixed(2)} 元`
}

module.exports = {
  getActivityArchiveRecords,
  buildPersonalityReport
}