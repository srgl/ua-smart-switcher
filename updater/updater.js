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
    const result = Object.keys(this.config).reduce((a, os) => (
      { ...a,
        [os]: this.config[os].browsers.reduce((a, browser) => (
          { ...a, [browser]: { version: '0' } }
        ), {})
      }
    ), {})

    agents.map(ua => {
      let parsed = UAParser(ua)
      return {
        os: (parsed.os.name || '')
          .toLowerCase().replace(/\s+/g, '_'),
        browser: (parsed.browser.name || '')
          .toLowerCase().replace(/\s+/g, '_')
          .replace('mobile_safari', 'safari'),
        version: parsed.browser.version,
        string: parsed.ua
      }
    }).forEach(ua => {
      const supported = ua.os in this.config &&
        this.config[ua.os].browsers.includes(ua.browser)
      if (supported) {
        let version = result[ua.os][ua.browser].version
        if (compareVersions(ua.version, version) === 1) {
          result[ua.os][ua.browser].version = ua.version
          result[ua.os][ua.browser].ua = ua.string
        }
      }
    })
    return result
  }
}

require.main === module && module.exports.init()
