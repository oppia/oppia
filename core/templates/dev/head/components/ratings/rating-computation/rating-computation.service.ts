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
 * @fileoverview Service for computing the average rating.
 */

var oppia = require('AppInit.ts').module;

oppia.factory('RatingComputationService', [function() {
  var areRatingsShown = function(ratingFrequencies) {
    var MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS = 1;

    var totalNumber = 0;
    for (var value in ratingFrequencies) {
      totalNumber += ratingFrequencies[value];
    }

    return totalNumber >= MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS;
  };

  return {
    computeAverageRating: function(ratingFrequencies) {
      if (!areRatingsShown(ratingFrequencies)) {
        return undefined;
      } else {
        var totalNumber = 0;
        var totalValue = 0.0;
        for (var value in ratingFrequencies) {
          totalValue += parseInt(value) * ratingFrequencies[value];
          totalNumber += ratingFrequencies[value];
        }

        if (totalNumber === 0) {
          return undefined;
        }

        return totalValue / totalNumber;
      }
    }
  };
}]);
