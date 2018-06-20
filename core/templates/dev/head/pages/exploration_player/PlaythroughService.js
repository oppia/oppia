// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for recording and scrutinizing playthroughs.
 */

oppia.constant(
  'STORE_PLAYTHROUGH_URL',
  '/explorehandler/store_playthrough/<exploration_id>');

oppia.factory('PlaythroughService', [
  '$http', 'PAGE_CONTEXT', 'PlaythroughObjectFactory',
  'LearnerActionObjectFactory', 'STORE_PLAYTHROUGH_URL',
  'UrlInterpolationService', 'StopwatchObjectFactory',
  'CURRENT_ISSUE_SCHEMA_VERSION', 'ISSUE_TYPE_EARLY_QUIT',
  'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS',
  'ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS', 'EARLY_QUIT_THRESHOLD_IN_SECS',
  'NUM_INCORRECT_ANSWERS_THRESHOLD', 'NUM_REPEATED_CYCLES_THRESHOLD',
  'CURRENT_ACTION_SCHEMA_VERSION', 'ACTION_TYPE_EXPLORATION_START',
  'ACTION_TYPE_ANSWER_SUBMIT', 'ACTION_TYPE_EXPLORATION_QUIT',
  function(
      $http, PAGE_CONTEXT, PlaythroughObjectFactory, LearnerActionObjectFactory,
      STORE_PLAYTHROUGH_URL, UrlInterpolationService, StopwatchObjectFactory,
      CURRENT_ISSUE_SCHEMA_VERSION, ISSUE_TYPE_EARLY_QUIT,
      ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS,
      ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS, EARLY_QUIT_THRESHOLD_IN_SECS,
      NUM_INCORRECT_ANSWERS_THRESHOLD, NUM_REPEATED_CYCLES_THRESHOLD,
      CURRENT_ACTION_SCHEMA_VERSION, ACTION_TYPE_EXPLORATION_START,
      ACTION_TYPE_ANSWER_SUBMIT, ACTION_TYPE_EXPLORATION_QUIT) {
    var playthrough = null;
    var expStopwatch = null;

    var multipleIncorrectStateName = {};

    var cycleIdentifier = {};
    var visitedStates = [];

    var createMultipleIncorrectIssueTracker = function(initStateName) {
      multipleIncorrectStateName = {
        state_name: initStateName,
        num_times_incorrect: 0
      };
    };

    var createCyclicIssueTracker = function(initStateName) {
      cycleIdentifier = {
        cycle: '',
        num_cycles: 0
      };

      visitedStates.push(initStateName);
    };

    var incrementIncorrectAnswerInMultipleIncorrectIssueTracker = function() {
      multipleIncorrectStateName.num_times_incorrect += 1;
    };

    var recordStateTransitionInMultipleIncorrectIssueTracker = function(
        destStateName) {
      if (multipleIncorrectStateName.num_times_incorrect <
        NUM_INCORRECT_ANSWERS_THRESHOLD) {
        multipleIncorrectStateName.state_name = destStateName;
        multipleIncorrectStateName.num_times_incorrect = 0;
      }
    };

    var recordStateTransitionInCyclicIssueTracker = function(destStateName) {
      if (cycleIdentifier.num_cycles < NUM_REPEATED_CYCLES_THRESHOLD) {
        if (visitedStates.indexOf(destStateName) !== -1) {
          // Cycle identified.
          var cycleStartIndex = visitedStates.indexOf(destStateName);
          visitedStates.push(destStateName);
          var cycleString =
            visitedStates.slice(
              cycleStartIndex, visitedStates.length).toString();
          if (cycleIdentifier.cycle === cycleString) {
            cycleIdentifier.num_cycles += 1;
          } else {
            cycleIdentifier.cycle = cycleString;
            cycleIdentifier.num_cycles = 1;
          }
          visitedStates = [destStateName];
        } else {
          visitedStates.push(destStateName);
        }
      }
    };

    var isMultipleIncorrectSubmissionsIssue = function() {
      return multipleIncorrectStateName.num_times_incorrect >=
        NUM_INCORRECT_ANSWERS_THRESHOLD;
    };

    var isCyclicStateTransitionsIssue = function() {
      return cycleIdentifier.num_cycles >= NUM_REPEATED_CYCLES_THRESHOLD;
    };

    var isEarlyQuitIssue = function(timeSpentInExpInSecs) {
      return timeSpentInExpInSecs < EARLY_QUIT_THRESHOLD_IN_SECS;
    };

    var analyzePlaythrough = function() {
      // The ordering of checks in this method is such that the priority of
      // issues to be recorded in case of multiple issues is captured. This
      // follows MultipleIncorrectSubmissionsIssue ->
      // CyclicStateTransitionsIssue -> EarlyQuitIssue.
      var timeSpentInExpInSecs = expStopwatch.getTimeInSecs();
      if (isMultipleIncorrectSubmissionsIssue()) {
        playthrough.issueType = ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS;
        playthrough.issueCustomizationArgs = {
          state_name: {
            value: multipleIncorrectStateName.state_name
          },
          num_times_answered_incorrectly: {
            value: multipleIncorrectStateName.num_times_incorrect
          }
        };
        return;
      }

      if (isCyclicStateTransitionsIssue()) {
        playthrough.issueType = ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS;
        playthrough.issueCustomizationArgs = {
          state_names: {
            value: cycleIdentifier.cycle.split(',')
          }
        };
        return;
      }

      if (isEarlyQuitIssue(timeSpentInExpInSecs)) {
        playthrough.issueType = ISSUE_TYPE_EARLY_QUIT;
        playthrough.issueCustomizationArgs = {
          state_name: {
            value:
              playthrough.actions[
                playthrough.actions.length - 1].actionCustomizationArgs
                .state_name.value
          },
          time_spent_in_exp_in_secs: {
            value: timeSpentInExpInSecs
          }
        };
        return;
      }
    };

    var storePlaythrough = function(isNewPlaythrough) {
      var promise = $http.post(getFullPlaythroughUrl(), {
        playthrough_data: playthrough.toBackendDict(),
        issue_schema_version: CURRENT_ISSUE_SCHEMA_VERSION
      });
      if (isNewPlaythrough) {
        promise.then(function(response) {
          if (response.data.playthrough_stored) {
            // In cases where maximum number of playthroughs already exists, the
            // above flag is not True and playthrough ID is not set.
            playthrough.playthroughId = response.data.playthrough_id;
          }
        });
      }
    };

    var getFullPlaythroughUrl = function() {
      return UrlInterpolationService.interpolateUrl(
        STORE_PLAYTHROUGH_URL, {
          exploration_id: playthrough.expId
        });
    };

    return {
      initSession: function(newExplorationId, newExplorationVersion) {
        playthrough = PlaythroughObjectFactory.createNew(
          null, newExplorationId, newExplorationVersion, null, {}, []);
        expStopwatch = StopwatchObjectFactory.create();
      },
      getPlaythrough: function() {
        return playthrough;
      },
      recordExplorationStartAction: function(initStateName) {
        playthrough.actions.push(LearnerActionObjectFactory.createNew(
          ACTION_TYPE_EXPLORATION_START,
          {
            state_name: {
              value: initStateName
            }
          },
          CURRENT_ACTION_SCHEMA_VERSION
        ));

        createMultipleIncorrectIssueTracker(initStateName);

        createCyclicIssueTracker(initStateName);

        expStopwatch.reset();
      },
      recordAnswerSubmitAction: function(
          stateName, destStateName, interactionId, answer, feedback,
          timeSpentInStateSecs) {
        playthrough.actions.push(LearnerActionObjectFactory.createNew(
          ACTION_TYPE_ANSWER_SUBMIT,
          {
            state_name: {
              value: stateName
            },
            dest_state_name: {
              value: destStateName
            },
            interaction_id: {
              value: interactionId
            },
            answer: {
              value: answer
            },
            feedback: {
              value: feedback
            },
            time_spent_in_state_secs: {
              value: timeSpentInStateSecs
            }
          },
          CURRENT_ACTION_SCHEMA_VERSION
        ));

        var didNotMoveToNextState = (destStateName === stateName);
        if (didNotMoveToNextState) {
          incrementIncorrectAnswerInMultipleIncorrectIssueTracker();
        } else {
          recordStateTransitionInMultipleIncorrectIssueTracker(destStateName);

          recordStateTransitionInCyclicIssueTracker(destStateName);
        }
      },
      recordExplorationQuitAction: function(
          stateName, timeSpentInStateSecs) {
        playthrough.actions.push(LearnerActionObjectFactory.createNew(
          ACTION_TYPE_EXPLORATION_QUIT,
          {
            state_name: {
              value: stateName
            },
            time_spent_in_state_secs: {
              value: timeSpentInStateSecs
            }
          },
          CURRENT_ACTION_SCHEMA_VERSION
        ));
      },
      recordPlaythrough: function(isExplorationComplete) {
        if (isExplorationComplete) {
          // If the exploration is completed, do not check for issues.
          return;
        }
        if (playthrough.playthroughId) {
          // Playthrough ID exists, so issue has already been identified.
          if (playthrough.issueType === ISSUE_TYPE_EARLY_QUIT) {
            // If the existing issue is of type early quit, and some other issue
            // can be identified, update the issue since early quit has lower
            // priority.
            analyzePlaythrough();
          }
          storePlaythrough(false);
        } else {
          // Playthrough ID doesn't exist.
          analyzePlaythrough();
          if (playthrough.issueType) {
            // Issue type exists, so an issue is identified after analyzing the
            // playthrough, and the playthrough is stored.
            storePlaythrough(true);
          }
        }
      }
    };
  }]);
