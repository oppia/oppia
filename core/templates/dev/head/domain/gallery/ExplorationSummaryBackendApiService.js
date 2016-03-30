// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to retrieve information about exploration summaries
 * from the backend.
 */

oppia.factory('ExplorationSummaryBackendApiService', [
    '$http', '$q', 'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE',
    'UrlInterpolationService',
    function($http, $q, EXPLORATION_SUMMARY_DATA_URL_TEMPLATE,
      UrlInterpolationService) {
  var _fetchExpSummaries = function(
      explorationIds, includePrivateExplorations, successCallback,
      errorCallback) {
    var explorationSummaryDataUrl = UrlInterpolationService.interpolateUrl(
      EXPLORATION_SUMMARY_DATA_URL_TEMPLATE, {
        stringified_exp_ids: JSON.stringify(explorationIds),
        include_private_explorations: JSON.stringify(includePrivateExplorations)
      });

    $http.get(explorationSummaryDataUrl).success(function(data) {
      var summaries = angular.copy(data.summaries);
      if (successCallback) {
        successCallback(summaries);
      }
    }).error(function(error) {
      if (errorCallback) {
        errorCallback(error);
      }
    });
  };

  return {
    /**
     * Fetches a list of public exploration summaries from the backend for each
     * exploration ID provided. The provided list of exploration summaries are
     * in the same order as input exploration IDs list, though some may be
     * missing (if the exploration doesn't exist or is private).
     */
    loadPublicExplorationSummaries: function(explorationIds) {
      return $q(function(resolve, reject) {
        _fetchExpSummaries(explorationIds, false, resolve, reject);
      });
    },

    /**
     * Behaves in the same way as loadPublicExplorationSummaries(), except it
     * also fetches private explorations for which the user has access. If the
     * user is currently logged out, this function behaves the same as
     * loadPublicExplorationSummaries().
     */
    loadPublicAndPrivateExplorationSummaries: function(explorationIds) {
      return $q(function(resolve, reject) {
        _fetchExpSummaries(explorationIds, true, resolve, reject);
      });
    },
  };
}]);
