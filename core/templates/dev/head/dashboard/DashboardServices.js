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

oppia.constant('EXPLORATIONS_SORT_BY_KEYS', {
  TITLE: 'title',
  LAST_UPDATED: 'last_updated_msec',
  NUM_VIEWS: 'num_views',
  OPEN_FEEDBACK: 'num_open_threads',
  UNRESOLVED_ANSWERS: 'num_unresolved_answers'
});

// Service for sorting the explorations based on different parameters.
oppia.factory('sortExplorationsService', [
  'utilsService', 'EXPLORATIONS_SORT_BY_KEYS', 'alertsService',
  function(utilsService, EXPLORATIONS_SORT_BY_KEYS, alertsService) {
    var EMPTY_TITLE_TEXT = 'Untitled';

    var sortByKey = function(explorationsList, key, isDescending) {
      var result = angular.copy(explorationsList);
      var prevValue, nextValue;
      result.sort(function(prev, next) {
        prevValue = prev[key];
        nextValue = next[key];
        if (key === 'title') {
          if (prevValue === '') {
            prevValue = EMPTY_TITLE_TEXT;
          }
          if (nextValue === '') {
            nextValue = EMPTY_TITLE_TEXT;
          }
        }
        if (utilsService.isString(prevValue)) {
          prevValue = prevValue.toLowerCase();
          nextValue = nextValue.toLowerCase();
        }
        return prevValue > nextValue;
      });
      if (isDescending) {
        return result.reverse();
      }
      return result;
    };
    return {
      getValidSortTypes: function() {
        return EXPLORATIONS_SORT_BY_KEYS;
      },

      sortBy: function(explorationsList, sortType, isDescending) {
        if (Object.keys(EXPLORATIONS_SORT_BY_KEYS).indexOf(sortType) !== -1) {
          return sortByKey(
            explorationsList,
            EXPLORATIONS_SORT_BY_KEYS[sortType],
            isDescending);
        }
        alertsService.addWarning(
          'Invalid type of key name for sorting explorations: ' + sortType);
        return explorationsList;
      }
    };
  }
]);
