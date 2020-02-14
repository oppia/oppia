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

require('services/alerts.service.ts');
require('services/validators.service.ts');

angular.module('oppia').factory('ExplorationSummaryBackendApiService', [
  '$http', '$q', 'AlertsService',
  'ValidatorsService', 'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE',
  function(
      $http, $q, AlertsService,
      ValidatorsService, EXPLORATION_SUMMARY_DATA_URL_TEMPLATE) {
    var _fetchExpSummaries = function(
        explorationIds, includePrivateExplorations, successCallback,
        errorCallback) {
      if (!explorationIds.every(ValidatorsService.isValidExplorationId)) {
        AlertsService.addWarning('Please enter a valid exploration ID.');

        var returnValue = [];
        for (var i = 0; i < explorationIds.length; i++) {
          returnValue.push(null);
        }

        if (errorCallback) {
          errorCallback(returnValue);
        }
        return;
      }

      var explorationSummaryDataUrl = EXPLORATION_SUMMARY_DATA_URL_TEMPLATE;

      $http.get(explorationSummaryDataUrl, {
        params: {
          stringified_exp_ids: JSON.stringify(explorationIds),
          include_private_explorations: JSON.stringify(
            includePrivateExplorations)
        }
      }).then(function(response) {
        var summaries = angular.copy(response.data.summaries);
        if (successCallback) {
          if (summaries === null) {
            var summariesError = (
              'Summaries fetched are null for explorationIds: ' + explorationIds
            );
            throw new Error(summariesError);
          }
          successCallback(summaries);
        }
      })['catch'](function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data || errorResponse);
        }
      });
    };

    return {
      /**
       * Fetches a list of public exploration summaries and private
       * exploration summaries for which the current user has access from the
       * backend for each exploration ID provided. The provided list of
       * exploration summaries are in the same order as input exploration IDs
       * list, though some may be missing (if the exploration doesn't exist or
       * or the user does not have access to it).
       */
      loadPublicAndPrivateExplorationSummaries: function(explorationIds) {
        return $q(function(resolve, reject) {
          _fetchExpSummaries(explorationIds, true, resolve, reject);
        });
      },
      loadPublicExplorationSummaries: function(explorationIds) {
        return $q(function(resolve, reject) {
          _fetchExpSummaries(explorationIds, false, resolve, reject);
        });
      }
    };
  }
]);
