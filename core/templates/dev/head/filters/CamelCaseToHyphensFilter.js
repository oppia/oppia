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
 * @fileoverview CamelCaseToHyphens filter for Oppia.
 */

oppia.constant('RULE_SUMMARY_WRAP_CHARACTER_COUNT', 30);

oppia.constant(
  'FEEDBACK_SUBJECT_MAX_CHAR_LIMIT',
  constants.FEEDBACK_SUBJECT_MAX_CHAR_LIMIT);

oppia.filter('camelCaseToHyphens', [function() {
  return function(input) {
    var result = input.replace(/([a-z])?([A-Z])/g, '$1-$2').toLowerCase();
    if (result[0] === '-') {
      result = result.substring(1);
    }
    return result;
  };
}]);
