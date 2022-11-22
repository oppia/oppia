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
 * @fileoverview Service for the rating functionality in the learner view.
 */

import { EventEmitter } from '@angular/core';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationEngineService } from './exploration-engine.service';
import { LearnerViewRatingBackendApiService } from './learner-view-rating-backend-api.service';

@Injectable({
  providedIn: 'root'
})
export class LearnerViewRatingService {
  // This property is initialized using int method and we need to do
  // non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  userRating!: number;
  private _ratingUpdatedEventEmitter: EventEmitter<void> = new EventEmitter();

  constructor(
    private explorationEngineService: ExplorationEngineService,
    private learnerViewRatingBackendApiService:
    LearnerViewRatingBackendApiService
  ) {}

  init(successCallback: (usrRating: number) => void): void {
    this.learnerViewRatingBackendApiService.getUserRatingAsync()
      .then((response) => {
        successCallback(response.user_rating);
        this.userRating = response.user_rating;
      });
  }

  submitUserRating(ratingValue: number): void {
    this.learnerViewRatingBackendApiService.submitUserRatingAsync(ratingValue)
      .then(() => {
        this.userRating = ratingValue;
        this._ratingUpdatedEventEmitter.emit();
      });
  }

  getUserRating(): number {
    return this.userRating;
  }

  get onRatingUpdated(): EventEmitter<void> {
    return this._ratingUpdatedEventEmitter;
  }
}

angular.module('oppia').factory('LearnerViewRatingService',
  downgradeInjectable(LearnerViewRatingService));
