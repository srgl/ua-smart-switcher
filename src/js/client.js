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
  `
}

const addScript = ua => {
  const script = document.createElement('script')
  script.innerText = getScript(ua)
  document.head.appendChild(script)
}

chrome.storage.local.get(null, state => {
  if (state.enabled) {
    addScript(state.custom ? state.customUA : state.browsers[state.browser][state.os].ua)
  }
})
