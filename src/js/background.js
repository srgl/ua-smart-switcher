let state = { enabled: false }

chrome.storage.local.get(null, values => {
  for (let key in values) {
    state[key] = values[key]
  }
})

chrome.storage.onChanged.addListener(values => {
  for (let key in values) {
    state[key] = values[key].newValue
  }
})

const onBeforeSendHeaders = ({ requestHeaders }) => {
  if (state.enabled && requestHeaders && requestHeaders.length) {
    const header = requestHeaders.find(h => h.name === 'User-Agent')
    if (header) {
      header.value = state.ua
      return { requestHeaders }
    }
  }
}

chrome.webRequest.onBeforeSendHeaders.addListener(
  onBeforeSendHeaders,
  { 'urls': ['<all_urls>'] },
  ['requestHeaders', 'blocking']
)
