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
  '$http', 'UrlInterpolationService', 'OPPORTUNITY_TYPE_SKILL',
  'OPPORTUNITY_TYPE_TRANSLATION', 'OPPORTUNITY_TYPE_VOICEOVER', function(
<<<<<<< HEAD
      $http, UrlInterpolationService) {
    var urlTemplate = '/opportunitiessummaryhandler/<opportunityType>';
    return {
      fetchOpportunities: function(opportunityType, params, successCallback) {
=======
      $http, UrlInterpolationService, OPPORTUNITY_TYPE_SKILL,
      OPPORTUNITY_TYPE_TRANSLATION, OPPORTUNITY_TYPE_VOICEOVER) {
    var urlTemplate = '/opportunitiessummaryhandler/<opportunityType>';
    return {
      fetchSkillOpportunities: function(cursor, successCallback) {
        return $http.get(
          UrlInterpolationService.interpolateUrl(
            urlTemplate, {opportunityType: OPPORTUNITY_TYPE_SKILL}
          ), {
            params: {
              cursor: cursor
            }
          }).then(function(response) {
          successCallback(response.data);
        });
      },
      fetchTranslationOpportunities: function(
          languageCode, cursor, successCallback) {
>>>>>>> 545d0050edc9c6e63a4e199901c7867ca0f3f8b9
        return $http.get(
          UrlInterpolationService.interpolateUrl(
            urlTemplate, {opportunityType: opportunityType}
          ), {
            params: params
          }).then(function(response) {
          successCallback(response.data);
        });
      }
    };
  }]);
