const getTemplate = userAgent => {
  return `
    Object.defineProperty(navigator, 'userAgent',  {get: function() { return '${userAgent}' }})
    Object.defineProperty(navigator, 'appVersion', {get: function() { return '${userAgent}' }})
    Object.defineProperty(navigator, 'vendor',     {get: function() { return '' }})
    Object.defineProperty(navigator, 'platform',   {get: function() { return '' }})
  `
}

chrome.storage.local.get(null, state => {
  if (state.enabled) {
    const ua = state.custom ? state.customs[state.customId].ua
      : state.browsers[state.browser][state.os].ua
    const script = document.createElement('script')
    script.innerHTML = getTemplate(ua)
    document.head.appendChild(script)
  }
})
