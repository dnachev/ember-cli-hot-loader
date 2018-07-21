import {all, Promise as rsvpPromise} from 'rsvp';

const DONT_RELOAD_PATTERNS = [/^(?!\/?assets\/).*/, /^\/?assets\/vendor-static\.js/];

function shouldReloadScript(scriptEl) {
  if (!scriptEl || scriptEl.getAttribute('src') == null) {
    return false;
  }
  const src = scriptEl.getAttribute('src');
  return !DONT_RELOAD_PATTERNS.some(pattern => pattern.test(src));
}

function loadScript(src) {
  return new rsvpPromise((resolve, reject) => {
    const scriptEl = document.createElement('script');
    scriptEl.onload = function() {
      resolve();
    };
    scriptEl.onerror = function(e) {
      reject(e);
    };
    scriptEl.type = 'text/javascript';
    scriptEl.src = src;
    document.body.appendChild(scriptEl);
  });
}

function createPlugin(hotReloadService) {
  function Plugin(window, host) {
    this.window = window;
    this.host = host;
  }
  Plugin.identifier = 'ember-hot-reload';
  Plugin.version = '1.0'; // Just following the example, this might not be even used
  Plugin.prototype.reload = function(path) {
    const cancelableEvent = {modulePath: path, cancel: false};
    hotReloadService.trigger('willLiveReload', cancelableEvent);
    if (cancelableEvent.cancel) {
      // Only hotreload if someone canceled the regular reload
      // Reloading app.js will fire Application.create unless we set this.
      window.runningTests = true;

      const scriptsToReload = [];
      const scriptTags = document.getElementsByTagName('script');
      for (let i = scriptTags.length - 1; i >= 0; i--) {
        if (shouldReloadScript(scriptTags[i])) {
          scriptsToReload.push(scriptTags[i]);
          scriptTags[i].parentNode.removeChild(scriptTags[i]);
        }
      }

      const pendingScripts = scriptsToReload.map(oldScriptEl =>
        loadScript(oldScriptEl.getAttribute('src')),
      );

      all(pendingScripts).then(() => {
        setTimeout(function() {
          window.runningTests = false;
          hotReloadService.trigger('willHotReload', path);
        }, 10);
      });

      return true;
    }
    return false;
  };
  Plugin.prototype.analyze = function() {
    return {
      disable: false,
    };
  };

  return Plugin;
}

function lookup(appInstance, fullName) {
  if (appInstance.lookup) {
    return appInstance.lookup(fullName);
  }
  return appInstance.application.__container__.lookup(fullName);
}

export function initialize(appInstance) {
  if (!window.LiveReload) {
    return;
  }
  const Plugin = createPlugin(
    lookup(appInstance, 'service:hot-reload'),
  );
  window.LiveReload.addPlugin(Plugin);
}

export default {
  name: 'hot-loader-livereload-plugin',
  initialize,
};
