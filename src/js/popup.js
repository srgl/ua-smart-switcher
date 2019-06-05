import { h, render, Component } from 'preact'
import config from '../config'

class Popup extends Component {
  constructor () {
    super()
    chrome.storage.local.get(null, state => {
      this.setState({
        agents: state.agents,
        enabled: state.enabled,
        os: state.os,
        browser: state.browser
      })
    })
  }

  close () {
    setTimeout(() => window.close(), 200)
  }

  toggle (e) {
    const enabled = e.target.checked
    this.setState({ enabled })
    chrome.storage.local.set({ enabled })
    if (!enabled) this.close()
  }

  setOs (e) {
    const os = e.target.value
    const browser = config.ui
      .find(({ platform }) => platform === os).browsers[0]
    this.setState({ os, browser })
    chrome.storage.local.set({ os, browser })
  }

  setBrowser (e) {
    const browser = e.target.value
    this.setState({ browser })
    chrome.storage.local.set({ browser })
    this.close()
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

  render (props, state) {
    if (!state.agents) return
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
            config.ui.map(({ platform }) => (
              <option value={platform}>{config.platforms[platform].name}</option>
            ))
          }
        </select>
      </div>
      <div class="row">
        <span>Browser:</span>
        <select class="right" disabled={!state.enabled}
          value={state.browser} onChange={this.setBrowser.bind(this)}>
          {
            config.ui.find(({ platform }) => platform === state.os).browsers.map(browser => {
              const agent = state.agents[state.os][browser]
              return <option value={browser}>
                {config.browsers[browser].name} {this.trimVersion(agent.version)}
              </option>
            })
          }
        </select>
      </div>
    </div>
  }
}

render(<Popup />, document.querySelector('#container'))
