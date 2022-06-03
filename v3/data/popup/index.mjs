import {match} from '../../worker/core/utils.mjs';

// localization
[...document.querySelectorAll('[data-i18n]')].forEach(e => {
  e[e.dataset.i18nValue || 'textContent'] = chrome.i18n.getMessage(e.dataset.i18n);
  if (e.dataset.i18nTitle) {
    e.title = chrome.i18n.getMessage(e.dataset.i18nTitle);
  }
});

let tab;

const allowed = document.getElementById('allowed');
allowed.addEventListener('change', () => chrome.tabs.update(tab.id, {
  autoDiscardable: allowed.checked === false
}));

const whitelist = {
  always: document.querySelector('[data-cmd=whitelist-domain]'),
  session: document.querySelector('[data-cmd=whitelist-session]')
};

const init = () => {
  // memo: what this argument for chrome.tabs.query?
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, tabs => {
    if (tabs.length) {
      tab = tabs[0];
      const {protocol = '', hostname} = new URL(tab.url);

      if (protocol.startsWith('http') || protocol.startsWith('ftp')) {
        chrome.runtime.sendMessage({
          'method': 'storage',
          'managed': {
            'whitelist': []
          },
          'session': {
            'whitelist.session': []
          }
        }, prefs => {
          whitelist.session.checked = match(prefs['whitelist.session'], hostname, tab.url) ? true : false;
          whitelist.always.checked = match(prefs['whitelist'], hostname, tab.url) ? true : false;
        });
        if (tab.autoDiscardable === false) {
          allowed.checked = true;
        }
        chrome.scripting.executeScript({
          target: {
            tabId: tab.id
          },
          func: () => document.title
        }).catch(e => {
          console.warn('Cannot access to this tab', e);
          allowed.parentElement.dataset.disabled = true;
        });
      }
      else { // on navigation
        whitelist.session.closest('.mlt').dataset.disabled = true;
        allowed.parentElement.dataset.disabled = true;
      }
    }
  });
};
init();

document.addEventListener('click', e => {
  const {target} = e;
  const cmd = target.dataset.cmd;

  if (cmd === 'open-options') {
    chrome.runtime.openOptionsPage();
  }
  else if (cmd && (cmd.startsWith('move-') || cmd === 'close')) {
    chrome.runtime.sendMessage({
      method: cmd,
      cmd
    }, init);
  }
  else if (cmd) {
    chrome.runtime.sendMessage({
      method: 'popup',
      cmd,
      shiftKey: e.shiftKey,
      checked: e.target.checked
    }, () => {
      window.close();
      chrome.runtime.lastError;
    });
  }
});
