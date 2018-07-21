/* eslint-env node */

'use strict';
const fs = require('fs');
const path = require('path');
const map = require('broccoli-stew').map;
const {
  splitVendorJs,
  vendorStaticFilepath
} = require('./lib/vendor-split');

module.exports = {
  name: 'ember-cli-hot-loader',
  serverMiddleware: function (config){
    if (config.options.environment === 'production' || config.options.environment === 'test') {
      return;
    }

    const lsReloader = require('./lib/hot-reloader')(config.options, this.supportedTypes);
    lsReloader.run();
  },

  included: function (app) {
    this._super.included(app);

    if (app.env === 'production' || app.env === 'test') {
      return;
    }

    const config = app.project.config('development');
    const addonConfig = config[this.name] || { supportedTypes: ['components'] };
    this.supportedTypes = addonConfig['supportedTypes'] || ['components'];

    this._includeEmberTemplateCompiler(app);
    this._configureVendor(app);
  },

  treeFor(name) {
    if (this.app.env === 'production' || this.app.env === 'test') {
      if (name === 'app' || name === 'addon') {
        const noopResolverMixin = 'define(\'ember-cli-hot-loader/mixins/hot-reload-resolver\', [\'exports\'], function (exports) { \'use strict\'; Object.defineProperty(exports, "__esModule", { value: true }); exports.default = Ember.Mixin.create({}); });';
        const resolverMixin = 'ember-cli-hot-loader/mixins/hot-reload-resolver.js';
        return map(this._super.treeFor.apply(this, arguments), (content, path) => {
          return path === resolverMixin ? noopResolverMixin : content;
        });
      }
      return;
    }
    return this._super.treeFor.apply(this, arguments);
  },

  contentFor(type, config) {
    if (type !== 'body') {
      return;
    }
    return `<script src="${config.rootURL}${vendorStaticFilepath}"></script>`;
  },

  _includeEmberTemplateCompiler(app) {
    const npmCompilerPath = path.join('ember-source', 'dist', 'ember-template-compiler.js');
    const npmPath = path.relative(app.project.root, require.resolve(npmCompilerPath));

    // Require template compiler as in CLI this is only used in build, we need it at runtime
    if (fs.existsSync(npmPath)) {
      app.import(npmPath);
    } else {
      throw new Error('Unable to locate ember-template-compiler.js. ember/ember-source not found in node_modules');
    }
  },

  _configureVendor(app) {
    const emberSource = app.project.findAddonByName('ember-source');

    splitVendorJs(app, [
      emberSource.paths.jquery,
      emberSource.paths.debug,
    ]);

    const loaderJs = app.project.findAddonByName('loader.js');
    if (loaderJs) {
      splitVendorJs(app, [
        {
          file: 'vendor/loader/loader.js',
          prepend: true
        }
      ]);
    }

    const emberCliBabel = app.project.findAddonByName('ember-cli-babel');
    if (emberCliBabel) {
      // babel plugin does not always include the polyfill, but splitVendorJs
      // will check before adding it
      splitVendorJs(app, ['vendor/babel-polyfill/polyfill.js']);
    }
  }
};
