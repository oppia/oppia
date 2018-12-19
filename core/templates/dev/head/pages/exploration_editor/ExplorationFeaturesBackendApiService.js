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
 * @fileoverview Service for fetching the features the exploration editor is
 * configured to support.
 */

oppia.constant(
  'EXPLORATION_FEATURES_URL', '/explorehandler/features/<exploration_id>');

oppia.factory('ExplorationFeaturesBackendApiService', [
  '$http', 'UrlInterpolationService', 'EXPLORATION_FEATURES_URL',
  function($http, UrlInterpolationService, EXPLORATION_FEATURES_URL) {
    return {
      /**
       * Retrieves data regarding the features the given exploration supports.
       *
       * NOTE: This service requires play-access for the Exploration so that the
       * features can be fetched in both the exploration player and editor.
       *
       * @returns {Object.<string, *>} - Describes the features the given
       *     exploration supports.
       */
      fetchExplorationFeatures: function(explorationId) {
        return $http.get(
          UrlInterpolationService.interpolateUrl(
            EXPLORATION_FEATURES_URL, {exploration_id: explorationId})
        ).then(function(response) {
          return response.data;
        });
      },
    };
  }]);
