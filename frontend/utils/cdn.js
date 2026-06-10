/**
 * CDN 图片资源配置
 * 所有装饰图、封面图走 CDN 拉取，品牌 logo 和页面底纹保留在工程包里。
 * 切换 CDN 域名时只需改 CDN_BASE 一行。
 */
const CDN_BASE = 'https://ywsfs.cn/static/img'

module.exports = {
  UI_CHARACTER: `${CDN_BASE}/ui-character.png`,
  UI_CONTROLLER: `${CDN_BASE}/ui-controller.png`,
  UI_HEADSET: `${CDN_BASE}/ui-headset.png`,
  UI_BEER_SKEWER: `${CDN_BASE}/ui-beer-skewer.png`,
  XUANTIANZHEN: `${CDN_BASE}/xuantianzhen.jpg`
}