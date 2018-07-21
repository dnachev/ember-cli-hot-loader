import {all, Promise as rsvpPromise} from 'rsvp';

const DONT_RELOAD_PATTERNS = [
  /^(?!\/?assets\/).*/,
  /^\/?assets\/vendor-static\.js/,
];

function shouldReloadScript(scriptEl) {
  if (!scriptEl || scriptEl.getAttribute('src') == null) {
    return false;
  }
  const src = scriptEl.getAttribute('src');
  return !DONT_RELOAD_PATTERNS.some(pattern => pattern.test(src));
}


function definePlugin(hotReloadService) {
  const LivereloadPlugin = class {
    constructor(_window) {
      this.window = _window;
    }

    reload(path) {
      const cancelableEvent = {modulePath: path, cancel: false};
      hotReloadService.trigger('willLiveReload', cancelableEvent);
      if (cancelableEvent.cancel) {
        // Only hotreload if someone canceled the regular reload
        // Reloading app.js will fire Application.create unless we set this.
        this.window.runningTests = true;

        const scriptsToReload = [];
        const scriptTags = this.window.document.getElementsByTagName('script');
        for (let i = scriptTags.length - 1; i >= 0; i--) {
          if (shouldReloadScript(scriptTags[i])) {
            scriptsToReload.push(scriptTags[i]);
            scriptTags[i].parentNode.removeChild(scriptTags[i]);
          }
        }

        const pendingScripts = scriptsToReload.map(oldScriptEl =>
          this._loadScript(oldScriptEl.getAttribute('src')),
        );

        all(pendingScripts).then(() => {
          setTimeout(function() {
            this.window.runningTests = false;
            hotReloadService.trigger('willHotReload', path);
          }, 10);
        });

        return true;
      }
      return false;
    }

    analyze() {
      return {
        disable: false,
      };
    }

    _loadScript(src) {
      return new rsvpPromise((resolve, reject) => {
        const scriptEl = this.window.document.createElement('script');
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
  };

  LivereloadPlugin.identifier = 'ember-hot-reload';
  LivereloadPlugin.version = '1.0';
  return LivereloadPlugin;
}

export function initialize(appInstance) {
  if (!window.LiveReload) {
    return;
  }
  const Plugin = definePlugin(appInstance.lookup('service:hot-reload'));
  window.LiveReload.addPlugin(Plugin);
}

export default {
  name: 'hot-loader-livereload-plugin',
  initialize,
};
