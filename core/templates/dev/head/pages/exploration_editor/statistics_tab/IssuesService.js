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

oppia.factory('IssuesService', [
  '$sce', 'IssuesBackendApiService', 'ISSUE_TYPE_EARLY_QUIT',
  function($sce, IssuesBackendApiService, ISSUE_TYPE_EARLY_QUIT) {
    var issues = null;
    var explorationId = null;
    var explorationVersion = null;
    var currentPlaythrough = null;

    var renderEarlyQuitIssueStatement = function() {
      return 'Several learners exited the exploration in less than a minute.';
    };

    var renderEarlyQuitIssueSuggestions = function(issue) {
      var suggestions = [$sce.trustAsHtml(
        'Review the cards up to and including <span class="state_link">' +
        '"' + issue.issueCustomizationArgs.state_name.value + '</span> for' +
        ' errors, ambiguities or insufficient motivation.'
      )];
      return suggestions;
    };

    return {
      initSession: function(newExplorationId, newExplorationVersion) {
        explorationId = newExplorationId;
        explorationVersion = newExplorationVersion;
      },
      getIssues: function() {
        return IssuesBackendApiService.fetchIssues(
          explorationId, explorationVersion).then(function(issues) {
          return issues;
        });
      },
      getPlaythrough: function(playthroughId) {
        return IssuesBackendApiService.fetchPlaythrough(
          explorationId, playthroughId).then(function(playthrough) {
          return playthrough;
        });
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
