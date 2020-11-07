const templatePart1 = 'Object.defineProperty(navigator,"userAgent",{get:function(){return"'
const templatePart2 = '"}}),Object.defineProperty(navigator,"vendor",{get:function(){return""}}),Object.defineProperty(navigator,"platform",{get:function(){return""}});'

chrome.storage.local.get(null, state => {
  if (state.enabled) {
    const ua = state.custom ? state.customUA : state.browsers[state.browser][state.os].ua
    const script = document.createElement('script')
    script.innerText = templatePart1 + ua + templatePart2
    document.head.appendChild(script)
  }
})
