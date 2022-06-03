import {log, query} from '../../core/utils.mjs';

const run = tab => {
  chrome.scripting.executeScript({
    target: {
      tabId: tab.id
    },
    func: () => {
      const run = () => chrome.runtime.sendMessage({
        method: 'discard.on.load'
      });
      if (document.readyState === 'uninitialized' || document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
      }
      else {
        run();
      }
    }
  }).catch(e => console.error('plugins/create -> error', e));
};

const observe = {
  tab: tab => tab.active === false && run(tab),
  window: win => {
    // memo: what this argument for chrome.tabs.query?
    setTimeout(() => chrome.tabs.query({
      windowId: win.id,
      active: false
    }, tbs => tbs.forEach(observe.tab)), 0);
  }
};

function enable() {
  log('create.enable is called');
  chrome.tabs.onCreated.addListener(observe.tab);
  chrome.windows.onCreated.addListener(observe.window);
  query({
    url: '*://*/*',
    status: 'loading',
    active: false
  }).then(tabs => tabs.forEach(run));
}
function disable() {
  log('create.disable is called');
  chrome.tabs.onCreated.removeListener(observe.tab);
  chrome.windows.onCreated.removeListener(observe.window);
}

export default {
  enable,
  disable
};
