const getScript = ua => {
  return `
    Object.defineProperty(window.navigator, 'userAgent', {
      get: function () {
        return '${ua.replace(/[='"\\]/g, '')}'
      }
    });
    Object.defineProperty(window.navigator, 'vendor', {
      get: function () {
        return ''
      }
    });
    Object.defineProperty(window.navigator, 'platform', {
      get: function () {
        return ''
      }
    });
  `.replace(/\s+/g, ' ')
}

const injectScript = ua => {
  const script = document.createElement('script')
  script.innerText = getScript(ua)
  document.head.appendChild(script)
}

chrome.storage.local.get(null, state => {
  if (state.enabled) injectScript(state.ua)
})

chrome.storage.onChanged.addListener(state => {
  if (state.reload) {
    window.location.reload(true)
  }
})
