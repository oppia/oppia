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
      var valA, valB;
      // JS Array.sort() method is stable in all major browsers except Chrome,
      // since Chrome uses quicksort internally if the length of Array to be
      // sorted is greater than 10. To make this stable, we maintain indexes of
      // items in the array and return non-zero values from the function passed
      // to .sort() method.
      result = result.map(function(data, idx) {
        return {
          index: idx,
          data: data
        };
      });
      result.sort(function(a, b) {
        var returnValue;
        valA = a.data[key];
        valB = b.data[key];
        if (key === EXPLORATIONS_SORT_BY_KEYS.TITLE &&
            utilsService.isString(valA)) {
          if (valA === '') {
            valA = EMPTY_TITLE_TEXT;
          }
          if (valB === '') {
            valB = EMPTY_TITLE_TEXT;
          }
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
          returnValue = valA.localeCompare(valB);
        } else {
          returnValue = valA - valB;
        }
        // NOTE TO DEVELOPERS: Make sure the value returned here is non-zero to
        // keep this sort stable.
        return returnValue ? returnValue : (a.index - b.index);
      });
      result = result.map(function(value) {
        return value.data;
      });
      if (isDescending) {
        return result.reverse();
      }
      return result;
    };
    return {
      sortBy: function(explorationsList, sortType, isDescending) {
        for (var sortKey in EXPLORATIONS_SORT_BY_KEYS) {
          if (EXPLORATIONS_SORT_BY_KEYS[sortKey] === sortType) {
            return sortByKey(
              explorationsList,
              EXPLORATIONS_SORT_BY_KEYS[sortKey],
              isDescending);
          }
        }
        alertsService.addWarning(
          'Invalid type of key name for sorting explorations: ' + sortType);
        return explorationsList;
      }
    };
  }
]);
