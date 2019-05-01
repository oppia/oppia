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
* @fileoverview Service for converting dates in milliseconds
* since the Epoch to human-readable dates.
*/

oppia.factory('DateTimeFormatService', ['$filter', function($filter) {
  return {
    // Returns just the time if the local datetime representation has the
    // same date as the current date. Otherwise, returns just the date if the
    // local datetime representation has the same year as the current date.
    // Otherwise, returns the full date (with the year abbreviated).
    getLocaleAbbreviatedDatetimeString: function(millisSinceEpoch) {
      var date = new Date(millisSinceEpoch);
      if (date.toLocaleDateString() === new Date().toLocaleDateString()) {
        return date.toLocaleTimeString([], {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
      } else if (date.getFullYear() === new Date().getFullYear()) {
        return $filter('date')(date, 'MMM d');
      } else {
        return $filter('date')(date, 'shortDate');
      }
    },
    // Returns just the date.
    getLocaleDateString: function(millisSinceEpoch) {
      var date = new Date(millisSinceEpoch);
      return date.toLocaleDateString();
    },
    // Returns whether the date is at most one week before the current date.
    isRecent: function(millisSinceEpoch) {
      var ONE_WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
      return new Date().getTime() - millisSinceEpoch < ONE_WEEK_IN_MILLIS;
    }
  };
}]);
