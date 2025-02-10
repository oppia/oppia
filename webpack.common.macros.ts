// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Macros for underscore template loader.
 */

const loaderUtils = require('loader-utils');
var path = require('path');

const objExtend = function (args, obj) {
  args = Array.prototype.slice.call(args);
  const _a = args.slice(1);
  _a.unshift(Object.assign(obj, args[0]));
  return _a;
};

module.exports = {
  load: function (resourcePath, args) {
    resourcePath = `/${resourcePath}`;
    const root = path.resolve(__dirname, 'core/templates');
    const argsExpr = args
      ? `(${objExtend})(arguments,
      ${JSON.stringify(args)})`
      : 'arguments';
    const resourceURL = JSON.stringify(
      loaderUtils.urlToRequest(resourcePath, root)
    );
    return `require(${resourceURL}).apply(null,${argsExpr})`;
  },

  loadExtensions: function (resourcePath) {
    resourcePath = `/${resourcePath}`;
    const root = path.resolve(__dirname, 'extensions');
    const resourceURL = JSON.stringify(
      loaderUtils.urlToRequest(resourcePath, root)
    );
    return `require(${resourceURL})()`;
  },
};
