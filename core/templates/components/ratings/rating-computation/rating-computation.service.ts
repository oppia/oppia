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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { ExplorationRatings } from
  'domain/summary/learner-exploration-summary.model';

type ExplorationRatingsKey = keyof ExplorationRatings;

@Injectable({
  providedIn: 'root'
})
export class RatingComputationService {
  static areRatingsShown(ratingFrequencies: ExplorationRatings): boolean {
    let MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS: number = 1;

    let totalNumber: number = 0;
    for (var value in ratingFrequencies) {
      totalNumber += ratingFrequencies[value as ExplorationRatingsKey];
    }

    return totalNumber >= MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS;
  }

  // Returns 'null' if the ratings are less than the
  // minimum acceptable number of ratings. The average should
  // not be computed in this case.
  computeAverageRating(
      ratingFrequencies: ExplorationRatings): number | null {
    if (!RatingComputationService.areRatingsShown(ratingFrequencies)) {
      return null;
    } else {
      var totalNumber = 0;
      var totalValue = 0.0;
      for (var value in ratingFrequencies) {
        let _value = value as ExplorationRatingsKey;
        totalValue += parseInt(_value) * ratingFrequencies[_value];
        totalNumber += ratingFrequencies[_value];
      }

      return totalValue / totalNumber;
    }
  }
}

angular.module('oppia').factory(
  'RatingComputationService', downgradeInjectable(RatingComputationService));
