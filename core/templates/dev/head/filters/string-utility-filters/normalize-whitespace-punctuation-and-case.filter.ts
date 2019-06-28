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
 * @fileoverview NormalizeWhitespacePunctuationAndCase filter for Oppia.
 */

// Filter that takes a string, trims and normalizes spaces within each
// line, and removes blank lines. Note that any spaces whose removal does not
// result in two alphanumeric "words" being joined together are also removed,
// so "hello ? " becomes "hello?".
oppia.filter('normalizeWhitespacePunctuationAndCase', [function() {
  return function(input) {
    if (typeof input === 'string' || input instanceof String) {
      var isAlphanumeric = function(character) {
        return 'qwertyuiopasdfghjklzxcvbnm0123456789'.indexOf(
          character.toLowerCase()) !== -1;
      };

      input = input.trim();
      var inputLines = input.split('\n');
      var resultLines = [];
      for (var i = 0; i < inputLines.length; i++) {
        var result = '';

        var inputLine = inputLines[i].trim().replace(/\s{2,}/g, ' ');
        for (var j = 0; j < inputLine.length; j++) {
          var currentChar = inputLine.charAt(j).toLowerCase();
          if (currentChar === ' ') {
            if (j > 0 && j < inputLine.length - 1 &&
                isAlphanumeric(inputLine.charAt(j - 1)) &&
                isAlphanumeric(inputLine.charAt(j + 1))) {
              result += currentChar;
            }
          } else {
            result += currentChar;
          }
        }

        if (result) {
          resultLines.push(result);
        }
      }

      return resultLines.join('\n');
    } else {
      return input;
    }
  };
}]);
