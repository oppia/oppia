// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to fetch statistics about an exploration's states.
 */

oppia.constant(
  'STATE_ANSWER_STATS_URL',
  '/createhandler/state_answer_stats/<exploration_id>');

oppia.factory('StateTopAnswersStatsBackendApiService', [
  '$http', 'UrlInterpolationService', 'STATE_ANSWER_STATS_URL',
  function($http, UrlInterpolationService, STATE_ANSWER_STATS_URL) {
    return {
      fetchStats: function(explorationId) {
        return $http.get(
          UrlInterpolationService.interpolateUrl(
            STATE_ANSWER_STATS_URL, {exploration_id: explorationId})
        ).then(function(response) {
          return response.data;
        });
      },
    };
  }
]);
