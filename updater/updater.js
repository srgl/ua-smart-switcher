const got = require('got')
const UAParser = require('ua-parser-js')
const compareVersions = require('compare-versions')

module.exports = class Updater {
  static async init () {
    const updater = new this()
    const agents = await updater.crawl()
    const latest = updater.getActualAgents(agents)
    console.log(latest)
  }

  constructor () {
    this.delay = 1000
    this.pages = 3
    this.config = {
      windows: {
        url: 'https://developers.whatismybrowser.com/useragents/explore/operating_system_name/windows/',
        browsers: [
          'chrome', 'firefox', 'edge', 'ie'
        ]
      },
      mac_os: {
        url: 'https://developers.whatismybrowser.com/useragents/explore/operating_system_name/macos/',
        browsers: [
          'safari', 'chrome', 'firefox'
        ]
      },
      linux: {
        url: 'https://developers.whatismybrowser.com/useragents/explore/operating_system_name/linux/',
        browsers: [
          'chrome', 'firefox'
        ]
      },
      android: {
        url: 'https://developers.whatismybrowser.com/useragents/explore/operating_system_name/android/',
        browsers: [
          'chrome', 'samsung_browser', 'android_browser'
        ]
      },
      ios: {
        url: 'https://developers.whatismybrowser.com/useragents/explore/operating_system_name/ios/',
        browsers: [
          'safari', 'chrome'
        ]
      }
    }
  }

  async crawl () {
    const results = []
    const regex = /<td class="useragent"><a[^>]+>([^<]+)</g

    for (let os in this.config) {
      for (let i = 1; i <= this.pages; i++) {
        let { body } = await got.get(this.config[os].url + i)

        let match
        while (match = regex.exec(body)) {
          results.push(match[1])
        }
        await new Promise(resolve => setTimeout(resolve, this.delay))
      }
    }
    return results
  }

  getActualAgents (agents) {
    const results = []

    agents.map(agent => {
      let parsed = UAParser(agent)
      return {
        os: (parsed.os.name || '')
          .toLowerCase().replace(/\s+/g, '_'),
        browser: (parsed.browser.name || '')
          .toLowerCase().replace(/\s+/g, '_')
          .replace('mobile_safari', 'safari'),
        version: parsed.browser.version,
        ua: parsed.ua
      }
    }).forEach(agent => {
      const supported = agent.os in this.config &&
        this.config[agent.os].browsers.includes(agent.browser)
      if (supported) {
        const result = results.find(r => r.os === agent.os && r.browser === agent.browser)
        if (!result) results.push(agent)
        if (result && (!result.version ||
          compareVersions(agent.version, result.version) === 1)) {
          result.version = agent.version
          result.ua = agent.ua
        }
      }
    })
    return results
  }
}

require.main === module && module.exports.init()
