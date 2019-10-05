// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for fetching the opportunities available for
 * contributors to contribute.
 */

angular.module('oppia').factory('ContributionOpportunitiesBackendApiService', [
  '$http', 'UrlInterpolationService', 'OPPORTUNITY_TYPE_TRANSLATION',
  'OPPORTUNITY_TYPE_VOICEOVER', function(
      $http, UrlInterpolationService, OPPORTUNITY_TYPE_TRANSLATION,
      OPPORTUNITY_TYPE_VOICEOVER) {
    var urlTemplate = '/opportunitiessummaryhandler/<opportunityType>';
    return {
      fetchTranslationOpportunities: function(
          languageCode, cursor, successCallback) {
        return $http.get(
          UrlInterpolationService.interpolateUrl(
            urlTemplate, {opportunityType: OPPORTUNITY_TYPE_TRANSLATION}
          ), {
            params: {
              language_code: languageCode,
              cursor: cursor
            }
          }).then(function(response) {
          successCallback(response.data);
        });
      },
      fetchVoiceoverOpportunities: function(
          languageCode, cursor, successCallback) {
        return $http.get(
          UrlInterpolationService.interpolateUrl(
            urlTemplate, {opportunityType: OPPORTUNITY_TYPE_VOICEOVER}
          ), {
            params: {
              language_code: languageCode,
              cursor: cursor
            }
          }).then(function(response) {
          successCallback(response.data);
        });
      },
    };
  }]);
