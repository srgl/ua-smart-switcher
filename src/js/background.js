import config from '../config'
import browsers from '../browsers'

const initialState = {
  enabled: false,
  custom: false,
  customUA: browsers[config.ui[0].browsers[0]][config.ui[0].platform].ua,
  os: config.ui[0].platform,
  browser: config.ui[0].browsers[0],
  browsers
}

const state = {}

const onBeforeSendHeaders = ({ requestHeaders }) => {
  if (state.enabled && requestHeaders && requestHeaders.length) {
    const header = requestHeaders.find(h => h.name === 'User-Agent')
    if (header) {
      header.value = state.custom ? state.customUA : state.browsers[state.browser][state.os].ua
      return { requestHeaders }
    }
  }
}

const updateLoop = (delay) => {
  setTimeout(() => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', 'https://uas.ztdev.com/v2/browsers/latest', true)
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const browsers = JSON.parse(xhr.responseText)
            if (Object.keys(browsers).length) chrome.storage.local.set({ browsers })
          } catch (e) {
            console.log('Unable to parse JSON:', e)
          }
        }

        updateLoop(3600 * 1000)
      }
    }
    xhr.send()
  }, delay)
}

const updateBadge = () => {
  if (!state.enabled) {
    chrome.browserAction.setBadgeText({ text: 'OFF' })
  } else if (state.custom) {
    chrome.browserAction.setBadgeText({ text: 'CUST' })
  } else if (state.os && state.browser) {
    const text = config.platforms[state.os].badge + '/' +
      config.browsers[state.browser].badge
    chrome.browserAction.setBadgeText({ text: text.toUpperCase() })
  }
}

const setState = (values) => {
  for (const key in values) {
    state[key] = values[key]
  }
  updateBadge()
}

const init = () => {
  updateLoop(2000)

  chrome.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeaders,
    { urls: ['http://*/*', 'https://*/*'] },
    ['requestHeaders', 'blocking']
  )

  chrome.storage.onChanged.addListener(values => {
    Object.keys(values).forEach(key => (values[key] = values[key].newValue))
    setState(values)
  })

  chrome.storage.local.get(null, values => {
    const state = {}
    for (const key in initialState) {
      state[key] = values[key] || initialState[key]
    }
    if (!(state.browser in config.browsers) || !(state.os in config.platforms)) {
      state.browser = initialState.browser
      state.os = initialState.os
    }
    setState(state)
    chrome.storage.local.set(state)
  })
}
init()
