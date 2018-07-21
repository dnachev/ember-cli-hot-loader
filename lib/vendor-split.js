/* eslint-env node */
const vendorStaticFilepath = 'assets/vendor-static.js';
const vendorFilepath = '/assets/vendor.js';

function removeOutputFiles(app, fileToRemove) {
  // TODO: public API for ember-cli? maybe: https://github.com/ember-cli/ember-cli/pull/7060
  const index = app._scriptOutputFiles[vendorFilepath].indexOf(fileToRemove);
  if (index > -1) {
    app._scriptOutputFiles[vendorFilepath].splice(index, 1);
    return true;
  }
  return false;
}

function splitVendorJs(app, filesConfig) {
  filesConfig.forEach(fileConfig => {
    const options = {
      outputFile: vendorStaticFilepath,
    };
    if (typeof fileConfig === 'string') {
      if (removeOutputFiles(app, fileConfig)) {
        app.import(fileConfig, options);
      }
      return;
    }
    const filePath = fileConfig.file;
    if (removeOutputFiles(app, filePath)) {
      if (fileConfig.prepend !== undefined) {
        options.prepend = fileConfig.prepend;
      }
      app.import(filePath, options);
    }
  });
}

module.exports = {
  splitVendorJs,
  vendorStaticFilepath,
};
