import { h, render, Component } from 'preact'
import config from '../config'
const chrome = window.chrome

class Popup extends Component {
  constructor () {
    super()
    chrome.storage.local.get(null, state => {
      this.setState({
        browsers: state.browsers,
        enabled: state.enabled,
        customs: state.customs,
        custom: state.custom,
        customId: state.customId,
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
    if (os.startsWith('custom')) {
      const customId = os.split('custom')[1]
      this.setState({ custom: true, customId })
      chrome.storage.local.set({ custom: true, customId })
    } else {
      const browser = config.ui
        .find(({ platform }) => platform === os).browsers[0]
      this.setState({ custom: false, os, browser })
      chrome.storage.local.set({ custom: false, os, browser })
    }
  }

  setBrowser (e) {
    const browser = e.target.value
    this.setState({ browser })
    chrome.storage.local.set({ browser })
    this.close()
  }

  setCustomUA (e) {
    const ua = e.target.value || ''
    const customs = [...this.state.customs]
    customs[this.state.customId].ua = ua
    this.setState({ customs })
    chrome.storage.local.set({ customs })
  }

  setCustomName (e) {
    const name = e.target.value || ''
    const customs = [...this.state.customs]
    customs[this.state.customId].name = name
    this.setState({ customs })
    chrome.storage.local.set({ customs })
  }

  addCustom (e) {
    const customs = [...this.state.customs]
    customs.push({ name: `Custom ${customs.length + 1}`, ua: customs[customs.length - 1].ua })
    this.setState({ customs, customId: customs.length - 1 })
    chrome.storage.local.set({ customs, customId: customs.length - 1 })
  }

  deleteCustom (e) {
    const customs = [...this.state.customs]
    customs.splice(this.state.customId, 1)
    this.setState({ customs, customId: customs.length - 1 })
    chrome.storage.local.set({ customs, customId: customs.length - 1 })
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

  setRate (rate) {
    this.setState({ rate })
  }

  openCheckPage () {
    chrome.tabs.create({ url: 'https://www.google.com/search?q=my+user+agent' })
  }

  openRatePage () {
    chrome.tabs.create({ url: 'https://chrome.google.com/webstore/detail/user-agent-smart-switcher/dgdmfclijcondkaobmpgbmibaaocfdpj/reviews' })
  }

  openDonatePage () {
    chrome.tabs.create({ url: 'https://paypal.me/srglbnv' })
  }

  render (props, state) {
    if (!state.browsers) return
    return <div class="popup">
      <div class="row">
        <h3 class="header">UA Smart Switcher</h3>
        <a href="" onClick={this.openCheckPage}>check</a>
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
          value={state.custom ? `custom${state.customId}` : state.os} onChange={this.setOs.bind(this)}>
          {
            config.ui.map(({ platform }) => (
              <option value={platform}>{config.platforms[platform].name}</option>
            ))
          }
          {
            (state.customs || []).map((c, i) => (
              <option value={`custom${i}`}>{c.name}</option>
            ))
          }
        </select>
      </div>
      {
        !state.custom && <div class="row">
          <span>Browser:</span>
          <select class="right" disabled={!state.enabled}
            value={state.browser} onChange={this.setBrowser.bind(this)}>
            {
              config.ui.find(({ platform }) => platform === state.os).browsers.map(browser => {
                const agent = state.browsers[browser][state.os]
                return <option value={browser}>
                  {config.browsers[browser].name} {this.trimVersion(agent.version)}
                </option>
              })
            }
          </select>
        </div>
      }
      {
        state.custom && <div>
          <div class="row">
            <input type="text" value={state.customs[state.customId].name}
              onInput={this.setCustomName.bind(this)} disabled={!state.enabled}></input>
            <button class="right" onClick={this.addCustom.bind(this)} disabled={!state.enabled}>Add</button>
            <button class="right" onClick={this.deleteCustom.bind(this)}
              disabled={!state.enabled || state.customs.length < 2}>Delete</button>
          </div>
          <div class="row">
            <textarea disabled={!state.enabled} placeholder="Enter a user agent string here"
              onInput={this.setCustomUA.bind(this)} value={state.customs[state.customId].ua}></textarea>
          </div>
        </div>
      }
      <div class="rate">Please rate extension&nbsp;
        {
          [1, 2, 3, 4, 5].map(i => (
            <span class={'star' + (state.rate > i - 1 ? ' gold' : '')}
              onClick={this.openRatePage}
              onMouseLeave={() => this.setRate(0)}
              onMouseEnter={() => this.setRate(i)}>&#9733;</span>
          ))
        }
        &nbsp;or <a href="" onClick={this.openDonatePage}>donate</a>
      </div>

    </div>
  }
}

render(<Popup />, document.querySelector('#container'))
