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

    var analyzePlaythrough = function() {
      // Check for early quit issue.
      if (expStopwatch.getTimeInSecs() < EARLY_QUIT_THRESHOLD_IN_SECS) {
        playthrough.issueType = ISSUE_TYPE_EARLY_QUIT;
        playthrough.issueCustomizationArgs = {
          state_name: {
            value:
              playthrough.actions[-1].actionCustomizationArgs.state_name.value
          },
          time_spent_in_exp_in_msecs: {
            value: expStopwatch.getTimeInSecs()
          }
        };
      }

      // Check for multiple incorrect submissions issue.
      if (multipleIncorrectStateName.num_times_incorrect >= (
          NUM_INCORRECT_ANSWERS_THRESHOLD)) {
        playthrough.issueType = ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS;
        playthrough.issueCustomizationArgs = {
          state_name: {
            value: multipleIncorrectStateName.state_name
          },
          num_times_answered_incorrectly: {
            value: multipleIncorrectStateName.num_times_incorrect
          }
        };
      }

      // Check for cyclic state transitions issue.
      if (cycleIdentifier.num_cycles >= NUM_REPEATED_CYCLES_THRESHOLD) {
        playthrough.issueType = ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS;
        playthrough.issueCustomizationArgs = {
          state_names: cycleIdentifier.cycle.split(',')
        };
      }
    };

    var getFullPlaythroughUrl = function() {
      return UrlInterpolationService.interpolateUrl(
        STORE_PLAYTHROUGH_URL, {
          exploration_id: playthrough.explorationId
        });
    };

    return {
      initSession: function(newExplorationId, newExplorationVersion) {
        playthrough = new PlaythroughObjectFactory(
          null, newExplorationId, newExplorationVersion, null, {}, []);
        expStopwatch = StopwatchObjectFactory.create();
      },
      recordExplorationStartAction: function(initStateName) {
        playthrough.actions.push(new LearnerActionObjectFactory(
          ACTION_TYPE_EXPLORATION_START, CURRENT_LEARNER_ACTION_SCHEMA_VERSION,
          {
            state_name: {
              value: initStateName
            }
          }
        ));

        multipleIncorrectStateName = {
          state_name: initStateName,
          num_times_incorrect: 0
        };

        cycleIdentifier = {
          cycle: "",
          num_cycles: 0
        };
        visitedStates.push(initStateName);
      },
      recordAnswerSubmitAction: function(
          stateName, destStateName, interactionId, answer, feedback,
          timeSpentInStateSecs) {
        playthrough.actions.push(new LearnerActionObjectFactory(
          ACTION_TYPE_ANSWER_SUBMIT, CURRENT_LEARNER_ACTION_SCHEMA_VERSION,
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
          }
        ));

        if (destStateName == stateName) {
          multipleIncorrectStateName.num_times_incorrect += 1;
        } else {
          if (multipleIncorrectStateName.num_times_incorrect < (
              NUM_INCORRECT_ANSWERS_THRESHOLD)) {
            multipleIncorrectStateName.state_name = destStateName;
            multipleIncorrectStateName.num_times_incorrect = 0;
          }

          if (cycleIdentifier.num_cycles < NUM_REPEATED_CYCLES_THRESHOLD) {
            // Cycle identified.
            if (visitedStates.indexOf(destStateName) !== -1) {
              var cycleStartIndex = visitedStates.indexOf(destStateName);
              visitedStates.push(destStateName);
              var cycleString =
                visitedStates.slice(
                  cycleStartIndex,
                  visitedStates.length - cycleStartIndex).toString();
              if (cycleIdentifier.cycle == cycleString) {
                cycleIdentifier.num_cycles += 1;
              } else {
                cycleIdentifier.cycle = cycleString;
                cycleIdentifier.num_cycles = 1;
              }
              visitedStates = [];
            } else {
              visitedStates.push(destStateName);
            }
          }
        }
      },
      recordExplorationQuitAction: function(
          stateName, timeSpentInStateSecs) {
        playthrough.actions.push(new LearnerAction(
          ACTION_TYPE_EXPLORATION_QUIT, CURRENT_LEARNER_ACTION_SCHEMA_VERSION,
          {
            state_name: {
              value: stateName
            },
            time_spent_in_state_secs: {
              value: timeSpentInStateSecs
            }
          }
        ));
      },
      recordPlaythrough: function() {
        if (playthrough.playthroughId) {
          $http.post(getFullPlaythroughUrl(), {
            playthrough_data: playthrough.convertToBackendDict(),
            issue_schema_version: CURRENT_EXPLORATION_ISSUE_SCHEMA_VERSION
          });
          return;
        }
        analyzePlaythrough();
        if (playthrough.issueType) {
          $http.post(getFullPlaythroughUrl(), {
            playthrough_data: playthrough.convertToBackendDict(),
            issue_schema_version: CURRENT_EXPLORATION_ISSUE_SCHEMA_VERSION
          }).then(function(response) {
            playthrough.playthroughId = response.playthroughId;
          });
        }
      }
    };
  }]);
