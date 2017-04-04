// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Functions to convert symbols available on the keyboard to
 *   desired logic symbols as a user types.
 */

var logicProofConversion = (function() {
  // NOTE: the 'old' values must all be single characters
  var REPLACEMENT_PAIRS = [{
    old: '&',
    // jscs:disable disallowQuotedKeysInObjects
    'new': '\u2227'
  }, {
    old: '|',
    'new': '\u2228'
  }, {
    old: '@',
    'new': '\u2200'
  }, {
    old: '$',
    'new': '\u2203'
  }, {
    old: '^',
    'new': '\u2227'
  }, {
    old: '\u0009',
    'new': '  '
    // jscs:enable disallowQuotedKeysInObjects
  }];

  var convertToLogicCharacters = function(oldString) {
    var replacedString = oldString;
    for (var i = 0; i < REPLACEMENT_PAIRS.length; i++) {
      // We don't use .replace() as it only affects the first instance
      replacedString = replacedString.split(
        REPLACEMENT_PAIRS[i].old).join(REPLACEMENT_PAIRS[i]['new']);
    }
    return replacedString;
  };

  return {
    convertToLogicCharacters: convertToLogicCharacters
  };
}());
