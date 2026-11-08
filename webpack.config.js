/**
 * Custom webpack config for @angular-builders/custom-webpack.
 * Excludes vendored third_party CSS/SCSS assets from css-minimizer-webpack-plugin
 * to avoid non-actionable warnings from legacy/SCSS syntax in CKEditor skins.
 * Does not modify third_party files or change app CSS/UI behavior.
 */
module.exports = config => {
  if (config.optimization && Array.isArray(config.optimization.minimizer)) {
    config.optimization.minimizer.forEach(plugin => {
      if (
        plugin &&
        plugin.constructor &&
        plugin.constructor.name === 'CssMinimizerPlugin'
      ) {
        plugin.options = plugin.options || {};
        const thirdPartyExclude = /[\\/]third_party[\\/]/;
        if (plugin.options.exclude) {
          plugin.options.exclude = Array.isArray(plugin.options.exclude)
            ? plugin.options.exclude.concat(thirdPartyExclude)
            : [plugin.options.exclude, thirdPartyExclude];
        } else {
          plugin.options.exclude = thirdPartyExclude;
        }

        const prevFilter = plugin.options.warningsFilter;
        plugin.options.warningsFilter = (warning, file, source) => {
          if (file && file.indexOf('third_party') !== -1) {
            return false;
          }
          if (typeof prevFilter === 'function') {
            return prevFilter(warning, file, source);
          }
          return true;
        };
      }
    });
  }
  return config;
};
