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
 Includes class with subsequent functions that intialize, submit (update),
 and get learner view ratings.
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
  userRating: number;
  private _ratingUpdatedEventEmitter: EventEmitter<void> = new EventEmitter();

  constructor(
    private explorationEngineService: ExplorationEngineService,
    private learnerViewRatingBackendApiService:
    LearnerViewRatingBackendApiService
  ) {}

  // Updates the view rating value of this particlaur instance of the
  // LearnerViewRatingService class by using the controller scope object.
  /**
   * @params successCallback - function that recieves value from controller
   */
  init(successCallback: (usrRating) => void): void {
    this.learnerViewRatingBackendApiService.getUserRatingAsync()
      .then((response) => {
        successCallback(response.user_rating);
        this.userRating = response.user_rating;
      });
  }

  // Submits an updated value of the the userRating for the specifc instance
  // of the LearnerViewRatingService class and submits an event to
  // the EventEmitter.
  /**
   * @params ratingValue - variable input number that is assigned the
   userRating.
   */
  submitUserRating(ratingValue: number): void {
    this.learnerViewRatingBackendApiService.submitUserRatingAsync(ratingValue)
      .then(() => {
        this.userRating = ratingValue;
        this._ratingUpdatedEventEmitter.emit();
      });
  }

  // Gets/returns the user rating value of that specific instance of the
  // LearnerViewRatingService class.
  /**
   * @return the current value of the userRating instance variable of the
   specific instance of the LearnerViewRatingService class.
   */
  getUserRating(): number {
    return this.userRating;
  }

  // This function gets and then returns the _ratingUpdatedEventEmitter
  // associated with the specific instance of the LearnerViewRatingService
  // class called upon.
  /**
   * @returns the event log of the specific LearnerViewRatingService
   instance being called upon.
   */
  get onRatingUpdated(): EventEmitter<void> {
    return this._ratingUpdatedEventEmitter;
  }
}

angular.module('oppia').factory('LearnerViewRatingService',
  downgradeInjectable(LearnerViewRatingService));
