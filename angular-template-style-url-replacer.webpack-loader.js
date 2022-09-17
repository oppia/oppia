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
 * with template: require('./html). This is needed for our webpack based
 * compilation and not the angular compiler. Angular compiler parses the html
 * and converts it to js instructions.
 */


const TEMPLATE_URL_REGEX = /templateUrl\s*:(\s*['"`](.*?)['"`]\s*([,}]))/gm;
const STYLES_URL_REGEX = /styleUrls *:(\s*\[[^\]]*?\])/g;
const VALUE_REGEX = /(['`"])((?:[^\\]\\\1|.)*?)\1/g;

const replaceStringsWithRequiresStatement = (str) => {
  return str.replace(VALUE_REGEX, function(_, __, url) {
    if (url.charAt(0) !== '.') {
      url = './' + url;
    }
    return "require('" + url + "')";
  });
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const loader = (sourceString) => {
  // Not cacheable during unit tests;
  this.cacheable && this.cacheable();

  const newSource = sourceString.replace(TEMPLATE_URL_REGEX, (_, url) => {
    return 'template' + ':' + replaceStringsWithRequiresStatement(url);
  }).replace(STYLES_URL_REGEX, () => {
    return 'styleUrl: []';
  });

  return newSource;
};


module.exports = loader;
