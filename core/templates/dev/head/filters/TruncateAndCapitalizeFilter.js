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
 * @fileoverview TruncateAndCapitalize filter for Oppia.
 */

// Note that this filter does not truncate at the middle of a word.
oppia.filter('truncateAndCapitalize', [function() {
  return function(input, maxNumberOfCharacters) {
    if (!input) {
      return input;
    }
    var words = input.trim().match(/\S+/g);

    // Capitalize the first word and add it to the result.
    var result = words[0].charAt(0).toUpperCase() + words[0].slice(1);

    // Add the remaining words to the result until the character limit is
    // reached.
    for (var i = 1; i < words.length; i++) {
      if (!maxNumberOfCharacters ||
          result.length + 1 + words[i].length <= maxNumberOfCharacters) {
        result += ' ';
        result += words[i];
      } else {
        result += '...';
        break;
      }
    }

    return result;
  };
}]);
