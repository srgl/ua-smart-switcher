import { h, render, Component } from 'preact'
import agents from '../agents'

const oss = [
  { id: 'windows', name: 'Windows' },
  { id: 'mac_os', name: 'macOS' },
  { id: 'linux', name: 'Linux' },
  { id: 'android', name: 'Android' },
  { id: 'ios', name: 'iOS' }
]

const browsers = [
  { id: 'safari', name: 'Safari' },
  { id: 'chrome', name: 'Chrome' },
  { id: 'firefox', name: 'Firefox' },
  { id: 'edge', name: 'Edge' },
  { id: 'ie', name: 'IE' },
  { id: 'samsung_browser', name: 'Samsung' },
  { id: 'android_browser', name: 'Android' }
]

agents.sort((a, b) => {
  const aIndex = 10 * (oss.findIndex(os => os.id === a.os) + 1) +
    browsers.findIndex(browser => browser.id === a.browser)
  const bIndex = 10 * (oss.findIndex(os => os.id === b.os) + 1) +
    browsers.findIndex(browser => browser.id === b.browser)

  return aIndex - bIndex
})

class Popup extends Component {
  constructor () {
    super()
    chrome.storage.local.get(null, state => {
      this.setState({
        enabled: state.enabled || false,
        os: state.os || agents[0].os,
        browser: state.browser || agents[0].browser
      })
    })
  }

  close () {
    setTimeout(() => window.close(), 200)
  }

  toggle (e) {
    const enabled = e.target.checked
    this.setState({ enabled }, () => {
      chrome.storage.local.set(this.state, () => {
        if (!enabled) this.close()
      })
    })
  }

  setOs (e) {
    const os = e.target.value
    const { browser, ua } = agents.find(a => a.os === os)
    this.setState({ os, browser, ua }, () => {
      chrome.storage.local.set(this.state)
    })
  }

  setBrowser (e) {
    const browser = e.target.value
    const { ua } = agents.find(a => (
      a.os === this.state.os && a.browser === browser
    ))
    this.setState({ browser, ua }, () => {
      chrome.storage.local.set(this.state, () => this.close())
    })
  }

  trimVersion (version) {
    const match = version.match(/^(\d+)\.(\d+)/)
    if (match) {
      const major = match[1]
      const minor = match[2]
      return minor === '0' ? major : `${major}.${minor}`
    }
    return version
  }

  browserName (browser) {
    return browsers.find(b => b.id === browser).name
  }

  render (props, state) {
    return <div class="popup">
      <div class="row">
        <h3 class="header">UA Smart Switcher</h3>
        { state.enabled != null &&
          <label class="switch right">
            <input type="checkbox" checked={state.enabled}
              onChange={this.toggle.bind(this)} />
            <span class="slider round"></span>
          </label>
        }
      </div>
      <div class="row">
        <span>Platform:</span>
        <select class="right" disabled={!state.enabled}
          value={state.os} onChange={this.setOs.bind(this)}>
          {
            state.os && oss.map(os => (
              <option value={os.id}>{os.name}</option>
            ))
          }
        </select>
      </div>
      <div class="row">
        <span>Browser:</span>
        <select class="right" disabled={!state.enabled}
          value={state.browser} onChange={this.setBrowser.bind(this)}>
          {
            state.os && agents.filter(a => a.os === state.os)
              .map(agent => (
                <option value={agent.browser}>
                  {this.browserName(agent.browser)} {this.trimVersion(agent.version)}
                </option>
              ))
          }
        </select>
      </div>
    </div>
  }
}

render(<Popup />, document.querySelector('#container'))
