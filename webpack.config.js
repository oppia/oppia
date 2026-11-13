// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Custom webpack config for @angular-builders/custom-webpack.
 * Excludes vendored third_party assets from css-minimizer-webpack-plugin to
 * avoid non-actionable warnings from legacy/SCSS syntax in CKEditor skins.
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
        const thirdPartyExclude = /(^|[\\/])third_party[\\/]/;
        if (plugin.options.exclude) {
          plugin.options.exclude = Array.isArray(plugin.options.exclude)
            ? plugin.options.exclude.concat(thirdPartyExclude)
            : [plugin.options.exclude, thirdPartyExclude];
        } else {
          plugin.options.exclude = thirdPartyExclude;
        }

        const prevFilter = plugin.options.warningsFilter;
        plugin.options.warningsFilter = (warning, file, source) => {
          if (file && /(^|[\\/])third_party[\\/]/.test(file)) {
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
