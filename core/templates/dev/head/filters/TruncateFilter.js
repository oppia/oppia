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
 * @fileoverview Truncate filter for Oppia.
 */

// Filter that truncates long descriptors.
oppia.filter('truncate', ['$filter', function($filter) {
  return function(input, length, suffix) {
    if (!input) {
      return '';
    }
    if (isNaN(length)) {
      length = 70;
    }
    if (suffix === undefined) {
      suffix = '...';
    }
    if (!angular.isString(input)) {
      input = String(input);
    }
    input = $filter('convertToPlainText')(input);
    return (
      input.length <= length ? input : (
        input.substring(0, length - suffix.length) + suffix));
  };
}]);
