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

require('domain/utilities/url-interpolation.service.ts');
require('services/playthrough-issues-backend-api.service.ts');
require(
  'pages/exploration-editor-page/statistics-tab/services/' +
  'learner-action-render.service.ts');
require(
  'pages/exploration-editor-page/improvements-tab/services/' +
  'improvement-modal.service.ts');

angular.module('oppia').factory('PlaythroughIssuesService', [
  'ImprovementModalService', 'PlaythroughIssuesBackendApiService',
  'ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS', 'ISSUE_TYPE_EARLY_QUIT',
  'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS',
  function(
      ImprovementModalService, PlaythroughIssuesBackendApiService,
      ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS, ISSUE_TYPE_EARLY_QUIT,
      ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
    var explorationId = null;
    var explorationVersion = null;

    var renderEarlyQuitIssueStatement = function() {
      return 'Several learners exited the exploration in less than a minute.';
    };

    var renderMultipleIncorrectIssueStatement = function(stateName) {
      return 'Several learners submitted answers to card "' + stateName +
        '" several times, then gave up and quit.';
    };

    var renderCyclicTransitionsIssueStatement = function(stateName) {
      return 'Several learners ended up in a cyclic loop revisiting card "' +
        stateName + '" many times.';
    };

    var renderEarlyQuitIssueSuggestions = function(stateName) {
      var suggestions = [(
        'Review the cards up to and including "' + stateName +
        '" for errors, ' + 'ambiguities, or insufficient motivation.'),
      ];
      return suggestions;
    };

    var renderMultipleIncorrectIssueSuggestions = function(stateName) {
      var suggestions = [(
        'Check the wording of the card "' + stateName + '" to ensure it is ' +
        'not confusing.'), (
        'Consider addressing the answers submitted in the sample ' +
          'playthroughs explicitly using answer groups.'),
      ];
      return suggestions;
    };

    var renderCyclicTransitionsIssueSuggestions = function(stateNames) {
      var finalIndex = stateNames.length - 1;
      var suggestions = [(
        'Check that the concept presented in "' + stateNames[0] + '" has ' +
        'been reinforced sufficiently by the time the learner gets to "' +
        stateNames[finalIndex] + '".'),
      ];
      return suggestions;
    };

    return {
      /** Prepares the PlaythroughIssuesService for subsequent calls to other
       * functions.
       *
       * @param {string} newExplorationId - the exploration id the service will
       *    be targeting.
       * @param {number} newExplorationVersion - the version of the exploration
       *    the service will be targeting.
       */
      initSession: function(newExplorationId, newExplorationVersion) {
        explorationId = newExplorationId;
        explorationVersion = newExplorationVersion;
      },
      getIssues: function() {
        return PlaythroughIssuesBackendApiService.fetchIssues(
          explorationId, explorationVersion);
      },
      getPlaythrough: function(playthroughId) {
        return PlaythroughIssuesBackendApiService.fetchPlaythrough(
          explorationId, playthroughId);
      },
      renderIssueStatement: function(issue) {
        var issueType = issue.issueType;
        if (issueType === ISSUE_TYPE_EARLY_QUIT) {
          return renderEarlyQuitIssueStatement();
        } else if (issueType === ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
          return renderMultipleIncorrectIssueStatement(
            issue.issueCustomizationArgs.state_name.value);
        } else if (issueType === ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS) {
          return renderCyclicTransitionsIssueStatement(
            issue.issueCustomizationArgs.state_names.value[0]);
        }
      },
      renderIssueSuggestions: function(issue) {
        var issueType = issue.issueType;
        if (issueType === ISSUE_TYPE_EARLY_QUIT) {
          return renderEarlyQuitIssueSuggestions(
            issue.issueCustomizationArgs.state_name.value);
        } else if (issueType === ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
          return renderMultipleIncorrectIssueSuggestions(
            issue.issueCustomizationArgs.state_name.value);
        } else if (issueType === ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS) {
          return renderCyclicTransitionsIssueSuggestions(
            issue.issueCustomizationArgs.state_names.value);
        }
      },
      resolveIssue: function(issue) {
        return PlaythroughIssuesBackendApiService.resolveIssue(
          issue, explorationId, explorationVersion);
      },
      openPlaythroughModal: function(playthroughId, index) {
        this.getPlaythrough(playthroughId).then(function(playthrough) {
          ImprovementModalService.openPlaythroughModal(playthrough, index);
        });
      },
    };
  }]);
