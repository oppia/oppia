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
 * @fileoverview WrapTextWithEllipsis filter for Oppia.
 */

oppia.filter('wrapTextWithEllipsis', [
  '$filter', 'UtilsService', function($filter, UtilsService) {
    return function(input, characterCount) {
      if (UtilsService.isString(input)) {
        input = $filter('normalizeWhitespace')(input);
        if (input.length <= characterCount || characterCount < 3) {
          // String fits within the criteria; no wrapping is necessary.
          return input;
        }

        // Replace characters counting backwards from character count with an
        // ellipsis, then trim the string.
        return input.substr(0, characterCount - 3).trim() + '...';
      } else {
        return input;
      }
    };
  }
]);
