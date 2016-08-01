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
 * @fileoverview Standalone services for the creator dashboard page.
 */

// Service for sorting the explorations based on different parameters.
oppia.factory('sortExplorationsService', [function() {
  var SORT_BY_KEYS = [
    'title',
    'last_updated_msec',
    'num_views',
    'num_open_threads',
    'num_unresolved_answers'
  ];
  var EMPTY_TITLE_TEXT = 'Untitled';

  var sortByKey = function(explorationsList, key, reverse) {
    var result = explorationsList;
    var prevValue, nextValue;
    result.sort(function(prev, next) {
      if (key === 'title') {
        prevValue = prev[key] === '' ? EMPTY_TITLE_TEXT : prev[key];
        nextValue = next[key] === '' ? EMPTY_TITLE_TEXT : next[key];
      }
      if (typeof prevValue === 'string') {
        prevValue = prevValue.toLowerCase();
        nextValue = nextValue.toLowerCase();
      }
      return prevValue > nextValue;
    });
    if (reverse) {
      return result.reverse();
    }
    return result;
  };
  return {
    sortBy: function(explorationsList, param, reverse) {
      if (SORT_BY_KEYS.indexOf(param) !== -1) {
        return sortByKey(explorationsList, param, reverse);
      } else {
        return explorationsList;
      }
    }
  };
}]);
