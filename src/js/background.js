import config from '../config'
import agents from '../agents'

const initialState = {
  enabled: false,
  os: config.ui[0].platform,
  browser: config.ui[0].browsers[0],
  agents
}

const state = {}

const onBeforeSendHeaders = ({ requestHeaders }) => {
  if (state.enabled && requestHeaders && requestHeaders.length) {
    const header = requestHeaders.find(h => h.name === 'User-Agent')
    if (header) {
      header.value = state.agents[state.os][state.browser].string
      return { requestHeaders }
    }
  }
}

const getAgents = callback => {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', 'https://api.uastrings.com/v1/user_agents/latest', true)
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) return callback(JSON.parse(xhr.responseText).results)
      callback(null)
    }
  }
  xhr.send()
}

const updateLoop = (delay) => {
  setTimeout(() => {
    getAgents(agents => {
      if (agents) chrome.storage.local.set({ agents })
      updateLoop(3600 * 1000)
    })
  }, delay)
}

const init = () => {
  updateLoop(2000)

  chrome.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeaders,
    { 'urls': ['http://*/*', 'https://*/*'] },
    ['requestHeaders', 'blocking']
  )

  chrome.storage.onChanged.addListener(values => {
    for (let key in values) {
      state[key] = values[key].newValue
    }
  })

  chrome.storage.local.get(null, values => {
    if (!values.os) {
      chrome.storage.local.set(initialState)
    } else if (!values.agents) {
      chrome.storage.local.set({ agents })
    } else {
      for (let key in values) {
        state[key] = values[key]
      }
    }
  })
}

init()
