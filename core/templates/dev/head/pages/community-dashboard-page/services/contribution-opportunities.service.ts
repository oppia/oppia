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
 * @fileoverview A service for handling contribution opportunities in different
 * fields.
 */

require(
  'pages/community-dashboard-page/services/' +
  'contribution-opportunities-backend-api.service.ts');

angular.module('oppia').factory('ContributionOpportunitiesService', [
  'ContributionOpportunitiesBackendApiService',
  function(ContributionOpportunitiesBackendApiService) {
    var skillOpportunitiesCursor = null;
    var translationOpportunitiesCursor = null;
    var voiceoverOpportunitiesCursor = null;
    var moreSkillOpportunitiesAvailable = true;
    var moreTranslationOpportunitiesAvailable = true;
    var moreVoiceoverOpportunitiesAvailable = true;

    var _getSkillOpportunities = function(cursor, successCallback) {
      ContributionOpportunitiesBackendApiService.fetchSkillOpportunities(
        cursor, function(opportunities, nextCursor, more) {
          skillOpportunitiesCursor = nextCursor;
          moreSkillOpportunitiesAvailable = more;
          successCallback(opportunities, more);
        });
    };
    var _getTranslationOpportunities = function(
        languageCode, cursor, successCallback) {
      ContributionOpportunitiesBackendApiService.fetchTranslationOpportunities(
        languageCode, cursor, function(opportunities, nextCursor, more) {
          translationOpportunitiesCursor = nextCursor;
          moreTranslationOpportunitiesAvailable = more;
          successCallback(opportunities, more);
        });
    };
    var _getVoiceoverOpportunities = function(
        languageCode, cursor, successCallback) {
      ContributionOpportunitiesBackendApiService.fetchVoiceoverOpportunities(
        languageCode, cursor, function(opportunities, nextCursor, more) {
          voiceoverOpportunitiesCursor = nextCursor;
          moreVoiceoverOpportunitiesAvailable = more;
          successCallback(opportunities, more);
        });
    };

    return {
      getSkillOpportunities: function(successCallback) {
        _getSkillOpportunities('', successCallback);
      },
      getTranslationOpportunities: function(languageCode, successCallback) {
        _getTranslationOpportunities(languageCode, '', successCallback);
      },
      getVoiceoverOpportunities: function(languageCode, successCallback) {
        _getVoiceoverOpportunities(languageCode, '', successCallback);
      },
      getMoreSkillOpportunities: function(successCallback) {
        if (moreSkillOpportunitiesAvailable) {
          _getSkillOpportunities(skillOpportunitiesCursor, successCallback);
        }
      },
      getMoreTranslationOpportunities: function(languageCode, successCallback) {
        if (moreTranslationOpportunitiesAvailable) {
          _getTranslationOpportunities(
            languageCode, translationOpportunitiesCursor, successCallback);
        }
      },
      getMoreVoiceoverOpportunities: function(languageCode, successCallback) {
        if (moreVoiceoverOpportunitiesAvailable) {
          _getVoiceoverOpportunities(
            languageCode, voiceoverOpportunitiesCursor, successCallback);
        }
      }
    };
  }]);
