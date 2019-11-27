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

require('domain/opportunity/ExplorationOpportunitySummaryObjectFactory.ts');
require('domain/opportunity/SkillOpportunityObjectFactory.ts');

angular.module('oppia').factory('ContributionOpportunitiesBackendApiService', [
  '$http', 'ExplorationOpportunitySummaryObjectFactory',
  'SkillOpportunityObjectFactory', 'UrlInterpolationService',
  'OPPORTUNITY_TYPE_SKILL', 'OPPORTUNITY_TYPE_TRANSLATION',
  'OPPORTUNITY_TYPE_VOICEOVER',
  function($http, ExplorationOpportunitySummaryObjectFactory,
      SkillOpportunityObjectFactory, UrlInterpolationService,
      OPPORTUNITY_TYPE_SKILL, OPPORTUNITY_TYPE_TRANSLATION,
      OPPORTUNITY_TYPE_VOICEOVER) {
    var urlTemplate = '/opportunitiessummaryhandler/<opportunityType>';
    var _getOpportunityFromDict = function(opportunityType, opportunityDict) {
      if (
        opportunityType === OPPORTUNITY_TYPE_VOICEOVER ||
        opportunityType === OPPORTUNITY_TYPE_TRANSLATION) {
        return ExplorationOpportunitySummaryObjectFactory.createFromBackendDict(
          opportunityDict);
      } else if (opportunityType === OPPORTUNITY_TYPE_SKILL) {
        return SkillOpportunityObjectFactory.createFromBackendDict(
          opportunityDict);
      }
    };
    var _fetchOpportunities = function(
        opportunityType, params, successCallback) {
      return $http.get(
        UrlInterpolationService.interpolateUrl(
          urlTemplate, {opportunityType: opportunityType}
        ), {
          params: params
        }).then(function(response) {
        var data = response.data;
        var opportunities = [];
        for (var index in data.opportunities) {
          opportunities.push(_getOpportunityFromDict(
            opportunityType, data.opportunities[index]));
        }
        successCallback(opportunities, data.next_cursor, data.more);
      });
    };
    return {
      fetchSkillOpportunities: function(cursor, successCallback) {
        var params = {
          cursor: cursor
        };
        return _fetchOpportunities(
          OPPORTUNITY_TYPE_SKILL, params, successCallback);
      },
      fetchTranslationOpportunities: function(
          languageCode, cursor, successCallback) {
        var params = {
          language_code: languageCode,
          cursor: cursor
        };
        return _fetchOpportunities(
          OPPORTUNITY_TYPE_TRANSLATION, params, successCallback);
      },
      fetchVoiceoverOpportunities: function(
          languageCode, cursor, successCallback) {
        var params = {
          language_code: languageCode,
          cursor: cursor
        };
        return _fetchOpportunities(
          OPPORTUNITY_TYPE_VOICEOVER, params, successCallback);
      }
    };
  }]);
