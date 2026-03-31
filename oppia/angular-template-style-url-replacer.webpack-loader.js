// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview This is a webpack loader that replaces templateUrl: './html'
 * with template: require('./html'). This is needed for our webpack based
 * compilation and not the angular compiler. Angular compiler parses the html
 * and converts it to js instructions. For the style urls, the angular compiler
 * uses styleUrls while webpack uses imports. Hence, currently we put the
 * stylesheet as import and as a styleUrl in the component. Once we have moved
 * away from separate rtl css files, we will remove the import statements and
 * just keep styleUrls. Until then, for webpack, we need remove styleUrls for
 * webpack compilation.
 */

/**
 * The regexes are trying to find the templateUrl from the component decorator
 * Eg:
 * @Component({
 *   selector: 'oppia-base-content',
 *   templateUrl: './base-content.component.html',
 *   styleUrls: ['./base-content.component.css']
 * })
 *
 * From the above we need to get './base-content.component.html' and
 * ['./base-content.component.css'].
 *
 * After modifications, it will look like:
 * @Component({
 *   selector: 'oppia-base-content',
 *   template: require('./base-content.component.html'),
 *   styleUrls: []
 * })
 * Templates can be found using the regex:
 * templateUrl[any number of spaces]:[any number of spaces]
 * [any of '"` that starts a string in javascript]
 * [match all characters between the quotes][End quotes '"`]
 * [any number of spaces]
 * [
 *   ends with a comma or a closing curly bracket depending or wether there are
 *   more items in the decorator or not
 * ]
 */
const TEMPLATE_URL_REGEX = /templateUrl\s*:(\s*['"`](.*?)['"`]\s*([,}]))/gm;
const STYLES_URL_REGEX = /styleUrls *:(\s*\[[^\]]*?\])/g;
const VALUE_REGEX = /(['`"])((?:[^\\]\\\1|.)*?)\1/g;

/**
 * This function is only used for templateUrl modifications. From a string this
 * function extracts the first value inside quotes ('"`).
 * Example: For a string like: "templateUrl: './base-content.component.html',"
 * The VALUE_REGEX will match "'./base-content.component.html'" and the first
 * group is the quote ("'") and the second group is
 * ""./base-content.component.html"
 * @param {string} str
 * @returns Relative url
 */
const replaceStringsWithRequiresStatement = str => {
  return str.replace(VALUE_REGEX, function (_, __, url) {
    return "require('" + url + "')";
  });
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const loader = sourceString => {
  // https://webpack.js.org/api/loaders/#thiscacheable
  // Cacheable is an interface provided by webpack and is used to speed up
  // the build by caching results.
  this.cacheable && this.cacheable();
  /**
   * The templateURL regex will match something like:
   * "templateUrl: './base-content.component.html',"
   */
  const newSourceString = sourceString
    .replace(TEMPLATE_URL_REGEX, (_, url) => {
      return 'template:' + replaceStringsWithRequiresStatement(url);
    })
    .replace(STYLES_URL_REGEX, () => {
      /**
       * For the style urls, the angular compiler
       * uses styleUrls while webpack uses imports. Hence, currently we put the
       * stylesheet as import and as a styleUrl in the component. Once we have
       * moved away from separate rtl css files, we will remove the import
       * statements and just keep styleUrls. Until then, for webpack, we need
       * remove styleUrls property for webpack compilation.
       */
      return 'styleUrl: []';
    });

  return newSourceString;
};

module.exports = loader;
