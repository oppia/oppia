/* eslint-disable oppia/no-multiline-disable */
/* eslint-disable func-style */
function WebpackCompilerEventsPlugin(options) {
  this.options = options;
}

WebpackCompilerEventsPlugin.prototype.apply = function(compiler) {
  compiler.hooks.afterDone.tap(
    'webpack-compiler-events-plugin',
    this.options.afterDone);
};

function waitWebpackFactory(config) {
  return new Promise(resolve => {
    let isFirstBuild = true;
    config.plugins.push(new WebpackCompilerEventsPlugin({
      afterDone: () => {
        if (isFirstBuild) {
          // eslint-disable-next-line no-console
          console.log('First webpack build done');
          isFirstBuild = false;
          resolve();
        }
      }
    }));
  });
}
waitWebpackFactory.$inject = ['config'];

module.exports = {
  'framework:waitwebpack': ['factory', waitWebpackFactory]
};
