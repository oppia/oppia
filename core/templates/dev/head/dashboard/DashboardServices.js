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
  RATING: 'ratings',
  LAST_UPDATED: 'last_updated_msec',
  NUM_VIEWS: 'num_views',
  OPEN_FEEDBACK: 'num_open_threads',
  UNRESOLVED_ANSWERS: 'num_unresolved_answers'
});

oppia.constant('HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS', {
  TITLE: 'Title',
  RATING: 'Average Rating',
  LAST_UPDATED: 'Last Updated',
  NUM_VIEWS: 'Total Plays',
  OPEN_FEEDBACK: 'New Feedback',
  UNRESOLVED_ANSWERS: 'Unresolved Answers'
});

// Service for sorting the explorations based on different parameters.
oppia.factory('sortExplorationsService', [
  'utilsService', 'EXPLORATIONS_SORT_BY_KEYS', 'alertsService',
  'RatingComputationService',
  function(
      utilsService, EXPLORATIONS_SORT_BY_KEYS, alertsService,
      RatingComputationService) {
    var TITLE_TEXT_DEFAULT = 'Untitled';
    var AVERAGE_RATING_DEFAULT = 0.0;
    var NUM_VALUE_DEFAULT = 0;

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
            valA = TITLE_TEXT_DEFAULT;
          }
          if (valB === '') {
            valB = TITLE_TEXT_DEFAULT;
          }
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
          returnValue = valA.localeCompare(valB);
        } else if (key === EXPLORATIONS_SORT_BY_KEYS.RATING) {
          valA = RatingComputationService.computeAverageRating(valA);
          valB = RatingComputationService.computeAverageRating(valB);
          if (!valA) {
            valA = AVERAGE_RATING_DEFAULT;
          }
          if (!valB) {
            valB = AVERAGE_RATING_DEFAULT;
          }
        } else {
          if (typeof valA === 'undefined' || valA === null) {
            valA = NUM_VALUE_DEFAULT;
          }
          if (typeof valB === 'undefined' || valB === null) {
            valB = NUM_VALUE_DEFAULT;
          }
          returnValue = valA - valB;
        }
        // NOTE TO DEVELOPERS: Make sure the value returned here is non-zero to
        // keep this sort stable.
        return returnValue ? returnValue : (a.index - b.index);
      });
      result = result.map(function(value) {
        return value.data;
      });
      if (isDescending || angular.equals(explorationsList, result)) {
        return result.reverse();
      }
      return result;
    };
    return {
      getValidSortingKeys: function() {
        return EXPLORATIONS_SORT_BY_KEYS;
      },

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
