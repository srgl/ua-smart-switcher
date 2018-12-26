const fs = require('fs').promises
const { promisify } = require('util')
const rimraf = promisify(require('rimraf'))
const got = require('got')
const UAParser = require('ua-parser-js')
const compareVersions = require('compare-versions')
const simpleGit = require('simple-git/promise')

module.exports = class Updater {
  static async init () {
    const updater = new this()
    updater.run()
  }

  constructor () {
    this.delay = 1
    this.pages = 4
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

  async run () {
    const agents = await this.crawl()
    const actual = this.getActualAgents(agents)
    const path = await this.cloneRepo()
    let current = await fs.readFile(path + 'src/agents.json')
    current = JSON.parse(current)
    if (this.merge(current, actual)) {
      current = JSON.stringify(current, null, 2)
      await fs.writeFile(path + 'src/agents.json', current)
      await this.pushRepo(path)
    }
  }

  merge (currents, actuals) {
    let merged = false
    actuals.forEach(actual => {
      let current = currents.find(current => (
        current.os === actual.os && current.browser === actual.browser
      ))
      if (!current) {
        currents.push(actual)
        merged = true
      } else if (compareVersions(actual.version, current.version) === 1) {
        current.version = actual.version
        current.ua = actual.ua
        merged = true
      }
    })

    return merged
  }

  async pushRepo (path) {
    await fs.writeFile('/tmp/.deploy_key',
      Buffer.from(process.env.DEPLOY_KEY, 'base64'))
    const GIT_SSH_COMMAND = 'ssh -i /tmp/.deploy_key'

    const git = simpleGit(path)
    await git.env({ ...process.env, GIT_SSH_COMMAND })
    await git.add('.')
    await git.commit('Update user agent strings')
    await git.push('origin', 'master')
  }

  async cloneRepo () {
    const remote = 'git@github.com:srgl/ua-smart-switcher.git'
    const path = '/tmp/.repo/'
    await rimraf(path)
    await fs.mkdir(path)

    const git = simpleGit(path)
    await git.clone(remote, path)
    return path
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
