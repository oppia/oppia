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
  'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS',
  function(
      $sce, IssuesBackendApiService, ISSUE_TYPE_EARLY_QUIT,
      ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
    var issues = null;
    var explorationId = null;
    var explorationVersion = null;
    var currentPlaythrough = null;

    var renderEarlyQuitIssueStatement = function() {
      return 'Several learners exited the exploration in less than a minute.';
    };

    var renderMultipleIncorrectIssueStatement = function(stateName) {
      var statement =
        'Several learners submitted answers to card "' + stateName +
        '" several times, then gave up and quit.';
      return statement;
    };

    var renderEarlyQuitIssueSuggestions = function(issue) {
      var suggestions = [$sce.trustAsHtml(
        'Review the cards up to and including <span class="state_link">' +
        '"' + issue.issueCustomizationArgs.state_name.value + '</span> for' +
        ' errors, ambiguities or insufficient motivation.'
      )];
      return suggestions;
    };

    var renderMultipleIncorrectIssueSuggestions = function(stateName) {
      var suggestions = [$sce.trustAsHtml(
        'Check the wording of the card <span class="state_link">"' +
        stateName + '</span> to ensure it is not confusing.'
      ), $sce.trustAsHtml(
        'Consider addressing the answers submitted in the sample playthroughs' +
        ' explicitly, using answer groups.'
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
        var issueType = issue.issueType;
        if (issueType === ISSUE_TYPE_EARLY_QUIT) {
          return renderEarlyQuitIssueStatement();
        } else if (issueType === ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
          return renderMultipleIncorrectIssueStatement(
            issue.issueCustomizationArgs.state_name.value);
        }
      },
      renderIssueSuggestions: function(issue) {
        var issueType = issue.issueType;
        if (issueType === ISSUE_TYPE_EARLY_QUIT) {
          return renderEarlyQuitIssueSuggestions(issue);
        } else if (issueType === ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
          return renderMultipleIncorrectIssueSuggestions(
            issue.issueCustomizationArgs.state_name.value);
        }
      }
    };
  }]);
