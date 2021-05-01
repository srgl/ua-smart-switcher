import config from '../config'
import browsers from '../browsers'

const initialState = {
  enabled: false,
  os: config.ui[0].platform,
  browser: config.ui[0].browsers[0],
  browsers,
  custom: false,
  customId: 0,
  customs: [
    {
      name: 'Custom 1',
      ua: browsers[config.ui[0].browsers[0]][config.ui[0].platform].ua
    }
  ]
}

const state = {}

const onBeforeSendHeaders = ({ requestHeaders }) => {
  if (state.enabled) {
    const header = (requestHeaders || []).find(h => h.name === 'User-Agent')
    if (header) {
      header.value = state.custom ? state.customs[state.customId].ua
        : state.browsers[state.browser][state.os].ua
      return { requestHeaders }
    }
  }
}

const updateBrowsers = browsers => {
  Object.keys(browsers).forEach(browser => {
    Object.keys(browsers[browser]).forEach(platform => {
      browsers[browser][platform].ua = browsers[browser][platform].ua.replace(/[='"\\]/g, '')
    })
  })
  chrome.storage.local.set({ browsers })
}

const updateLoop = delay => {
  setTimeout(() => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', 'https://uas.ztdev.com/v2/browsers/latest', true)
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const browsers = JSON.parse(xhr.responseText)
        updateBrowsers(browsers)
      }
    }
    xhr.send()
    updateLoop(3600 * 1000)
  }, delay)
}

const updateBadge = () => {
  if (!state.enabled) {
    chrome.browserAction.setBadgeText({ text: 'OFF' })
  } else if (state.custom) {
    chrome.browserAction.setBadgeText({
      text: state.customs[state.customId].name.slice(0, 4).toUpperCase()
    })
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
