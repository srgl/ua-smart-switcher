import { h, render, Component } from 'preact'
import data from '../data'

const platforms = [
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

for (let platform in data) {
  data[platform] = browsers
    .filter(({ id }) => (id in data[platform]))
    .map(({ id, name }) => ({ ...data[platform][id], id, name }))
}

class Popup extends Component {
  constructor () {
    super()
    this.state = {
      enabled: false,
      platform: platforms[0].id,
      browser: data[platforms[0].id][0].id
    }
    chrome.storage.local.get(this.state, state => {
      this.setState(state)
    })
  }

  toggle (e) {
    this.setState({ enabled: e.target.checked }, () => {
      chrome.storage.local.set(this.state)
    })
  }

  setPlatform (e) {
    const platform = e.target.value
    this.setState({ platform, browser: data[platform][0].id }, () => {
      chrome.storage.local.set(this.state)
    })
  }

  setBrowser (e) {
    this.setState({ browser: e.target.value }, () => {
      chrome.storage.local.set(this.state)
    })
  }

  render (props, state) {
    return <div class="popup">
      <div class="row">
        <h3 class="header">UA Smart Switcher</h3>
        <label class="switch right">
          <input type="checkbox" checked={state.enabled} onChange={this.toggle.bind(this)} />
          <span class="slider round"></span>
        </label>
      </div>
      <div class="row">
        <span>Platform:</span>
        <select class="right" disabled={!state.enabled} value={state.platform} onChange={this.setPlatform.bind(this)}>
          {
            platforms.map(platform => (
              <option value={platform.id}>{platform.name}</option>
            ))
          }
        </select>
      </div>
      <div class="row">
        <span>Browser:</span>
        <select class="right" disabled={!state.enabled} value={state.browser} onChange={this.setBrowser.bind(this)}>
          {
            data[state.platform].map(browser => (
              <option value={browser.id}>{browser.name} {browser.version}</option>
            ))
          }
        </select>
      </div>
    </div>
  }
}

render(<Popup />, document.querySelector('#container'))
