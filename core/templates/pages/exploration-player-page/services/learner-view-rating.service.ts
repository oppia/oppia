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

require('pages/exploration-player-page/services/exploration-engine.service.ts');

import { EventEmitter } from '@angular/core';

angular.module('oppia').factory('LearnerViewRatingService', [
  '$http', 'ExplorationEngineService',
  function($http, ExplorationEngineService) {
    var explorationId = ExplorationEngineService.getExplorationId();
    var ratingsUrl = '/explorehandler/rating/' + explorationId;
    var userRating;
    var _ratingUpdatedEventEmitter = new EventEmitter();
    return {
      init: function(successCallback) {
        $http.get(ratingsUrl).then(function(response) {
          successCallback(response.data.user_rating);
          userRating = response.data.user_rating;
        });
      },
      submitUserRating: function(ratingValue) {
        $http.put(ratingsUrl, {
          user_rating: ratingValue
        });
        userRating = ratingValue;
        _ratingUpdatedEventEmitter.emit();
      },
      getUserRating: function() {
        return userRating;
      },
      get onRatingUpdated() {
        return _ratingUpdatedEventEmitter;
      }
    };
  }
]);
