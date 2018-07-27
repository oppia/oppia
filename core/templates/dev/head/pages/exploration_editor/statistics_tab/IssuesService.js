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

oppia.constant(
  'FETCH_PLAYTHROUGH_URL',
  '/playthroughdatahandler/<exploration_id>/<playthrough_id>');

oppia.factory('IssuesService', [
  '$http', '$sce', 'ExplorationIssueObjectFactory', 'PlaythroughObjectFactory',
  'UrlInterpolationService', 'FETCH_ISSUES_URL', 'FETCH_PLAYTHROUGH_URL',
  'ISSUE_TYPE_EARLY_QUIT',
  function(
      $http, $sce, ExplorationIssueObjectFactory, PlaythroughObjectFactory,
      UrlInterpolationService, FETCH_ISSUES_URL, FETCH_PLAYTHROUGH_URL,
      ISSUE_TYPE_EARLY_QUIT) {
    var issues = null;
    var explorationId = null;
    var explorationVersion = null;
    var currentPlaythrough = null;

    var renderEarlyQuitIssueStatement = function() {
      return 'Several learners exited the exploration in less than a minute.';
    };

    var renderEarlyQuitIssueSuggestions = function(issue) {
      var suggestions = [
        $sce.trustAsHtml(
          'Review the cards up to and including <span class="state_link">' +
          '"' + issue.issueCustomizationArgs.state_name.value + '"</span> for' +
          ' errors, ambiguities or insufficient motivation'
        )];
      return suggestions;
    };

    var fetchIssues = function() {
      $http.get(getFullIssuesUrl(), {
        params: {
          exp_version: explorationVersion
        }
      }).then(function(response) {
        var unresolvedIssuesDicts = response.data;
        issues = unresolvedIssuesDicts.map(
          ExplorationIssueObjectFactory.createFromBackendDict);
      });
    };

    var fetchPlaythrough = function(playthroughId) {
      return $http.get(getFullPlaythroughUrl(playthroughId)).then(
        function(response) {
          var playthroughDict = response.data;
          return PlaythroughObjectFactory.createFromBackendDict(
            playthroughDict);
        });
    };

    var getFullIssuesUrl = function() {
      return UrlInterpolationService.interpolateUrl(
        FETCH_ISSUES_URL, {
          exploration_id: explorationId
        });
    };

    var getFullPlaythroughUrl = function(playthroughId) {
      return UrlInterpolationService.interpolateUrl(
        FETCH_PLAYTHROUGH_URL, {
          exploration_id: explorationId,
          playthrough_id: playthroughId
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
      },
      getPlaythrough: function(playthroughId) {
        return fetchPlaythrough(playthroughId);
      },
      renderIssueStatement: function(issue) {
        if (issue.issueType === ISSUE_TYPE_EARLY_QUIT) {
          return renderEarlyQuitIssueStatement();
        }
      },
      renderIssueSuggestions: function(issue) {
        if (issue.issueType === ISSUE_TYPE_EARLY_QUIT) {
          return renderEarlyQuitIssueSuggestions(issue);
        }
      }
    };
  }]);
