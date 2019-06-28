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
 * @fileoverview TruncateAtFirstLine filter for Oppia.
 */

oppia.filter('truncateAtFirstLine', [function() {
  return function(input) {
    if (!input) {
      return input;
    }

    var pattern = /(\r\n|[\n\v\f\r\x85\u2028\u2029])/g;
    // Normalize line endings then split using the normalized delimiter.
    var lines = input.replace(pattern, '\n').split('\n');
    var firstNonemptyLineIndex = -1;
    var otherNonemptyLinesExist = false;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].length > 0) {
        if (firstNonemptyLineIndex === -1) {
          firstNonemptyLineIndex = i;
        } else {
          otherNonemptyLinesExist = true;
          break;
        }
      }
    }
    var suffix = otherNonemptyLinesExist ? '...' : '';
    return (
      firstNonemptyLineIndex !== -1 ?
      lines[firstNonemptyLineIndex] + suffix : '');
  };
}]);
