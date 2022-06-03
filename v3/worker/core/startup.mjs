import {prefs, storage} from './prefs.mjs';

const starters = {
  ready: false,
  cache: [],
  push(c) {
    if (starters.ready) {
      return c();
    }
    starters.cache.push(c);
    console.log("startup.mjs");
    alert("startup.mjs");
  }
};

{
  // preference are only up-to-date on the first run. For all other needs call storage().then()
  const once = () => storage(prefs).then(ps => {
    Object.assign(prefs, ps);
    starters.ready = true;
    starters.cache.forEach(c => c());
    delete starters.cache;
  });
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}

export {starters}
