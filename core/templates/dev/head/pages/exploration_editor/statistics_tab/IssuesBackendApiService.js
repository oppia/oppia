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
 * @fileoverview Service for fetching issues and playthroughs from the backend.
 */

oppia.constant(
  'FETCH_ISSUES_URL', '/issuesdatahandler/<exploration_id>');

oppia.constant(
  'FETCH_PLAYTHROUGH_URL',
  '/playthroughdatahandler/<exploration_id>/<playthrough_id>');

oppia.constant(
  'RESOLVE_ISSUE_URL', '/resolveissuehandler/<exploration_id>');

oppia.factory('IssuesBackendApiService', [
  '$http', 'ExplorationIssueObjectFactory', 'PlaythroughObjectFactory',
  'UrlInterpolationService', 'FETCH_ISSUES_URL', 'FETCH_PLAYTHROUGH_URL',
  'RESOLVE_ISSUE_URL',
  function(
      $http, ExplorationIssueObjectFactory, PlaythroughObjectFactory,
      UrlInterpolationService, FETCH_ISSUES_URL, FETCH_PLAYTHROUGH_URL,
      RESOLVE_ISSUE_URL) {
    var getFullIssuesUrl = function(explorationId) {
      return UrlInterpolationService.interpolateUrl(
        FETCH_ISSUES_URL, {
          exploration_id: explorationId
        });
    };

    var getFullPlaythroughUrl = function(expId, playthroughId) {
      return UrlInterpolationService.interpolateUrl(
        FETCH_PLAYTHROUGH_URL, {
          exploration_id: expId,
          playthrough_id: playthroughId
        });
    };

    var getFullResolveIssueUrl = function(explorationId) {
      return UrlInterpolationService.interpolateUrl(
        RESOLVE_ISSUE_URL, {
          exploration_id: explorationId
        });
    };
    return {
      fetchIssues: function(explorationId, explorationVersion) {
        return $http.get(getFullIssuesUrl(explorationId), {
          params: {
            exp_version: explorationVersion
          }
        }).then(function(response) {
          var unresolvedIssuesDicts = response.data;
          return unresolvedIssuesDicts.map(
            ExplorationIssueObjectFactory.createFromBackendDict);
        });
      },
      fetchPlaythrough: function(expId, playthroughId) {
        return $http.get(getFullPlaythroughUrl(expId, playthroughId)).then(
          function(response) {
            var playthroughDict = response.data;
            return PlaythroughObjectFactory.createFromBackendDict(
              playthroughDict);
          });
      },
      resolveIssue: function(issue, expId, expVersion) {
        $http.post(getFullResolveIssueUrl(expId), {
          exp_issue_dict: ExplorationIssueObjectFactory.toBackendDict(issue),
          exp_version: expVersion
        });
      }
    };
  }]);
