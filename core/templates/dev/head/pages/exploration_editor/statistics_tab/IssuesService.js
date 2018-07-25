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
 * @fileoverview Service for retrieving issues and playthroughs.
 */

oppia.constant(
  'FETCH_ISSUES_URL', '/issuesdatahandler/<exploration_id>');

oppia.factory('IssuesService', [
  '$http', 'ExplorationIssueObjectFactory', 'UrlInterpolationService',
  function($http, ExplorationIssueObjectFactory, UrlInterpolationService) {
    var issues = null;
    var explorationId = null;
    var explorationVersion = null;

    var fetchIssues = function() {
      $http.get(getFullIssuesUrl(), {
        exp_version: explorationVersion
      }).then(function(response) {
        var unresolvedIssuesDicts = response.unresolved_issues;
        issues = unresolvedIssuesDicts.map(
          ExplorationIssueObjectFactory.createFromBackendDict);
      });
    };

    var getFullIssuesUrl = function() {
      return UrlInterpolationService.interpolateUrl(
        FETCH_ISSUES_URL, {
          exploration_id: explorationId
        });
    };

    return {
      initSession: function(newExplorationId, newExplorationVersion) {
        explorationId = newExplorationId;
        explorationVersion = newExplorationVersion;
        fetchIssues();
      },
      getIssues: function() {
        return issues;
      }
    };
  }]);
