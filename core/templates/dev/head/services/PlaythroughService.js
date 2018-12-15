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
  '$http', 'LearnerActionObjectFactory', 'PlaythroughIssuesService',
  'PlaythroughObjectFactory', 'StopwatchObjectFactory',
  'UrlInterpolationService', 'ACTION_TYPE_ANSWER_SUBMIT',
  'ACTION_TYPE_EXPLORATION_START', 'ACTION_TYPE_EXPLORATION_QUIT',
  'CURRENT_ACTION_SCHEMA_VERSION', 'CURRENT_ISSUE_SCHEMA_VERSION',
  'EARLY_QUIT_THRESHOLD_IN_SECS', 'ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS',
  'ISSUE_TYPE_EARLY_QUIT', 'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS',
  'NUM_INCORRECT_ANSWERS_THRESHOLD', 'NUM_REPEATED_CYCLES_THRESHOLD',
  'PAGE_CONTEXT', 'STORE_PLAYTHROUGH_URL',
  function(
      $http, LearnerActionObjectFactory, PlaythroughIssuesService,
      PlaythroughObjectFactory, StopwatchObjectFactory,
      UrlInterpolationService, ACTION_TYPE_ANSWER_SUBMIT,
      ACTION_TYPE_EXPLORATION_START, ACTION_TYPE_EXPLORATION_QUIT,
      CURRENT_ACTION_SCHEMA_VERSION, CURRENT_ISSUE_SCHEMA_VERSION,
      EARLY_QUIT_THRESHOLD_IN_SECS, ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS,
      ISSUE_TYPE_EARLY_QUIT, ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS,
      NUM_INCORRECT_ANSWERS_THRESHOLD, NUM_REPEATED_CYCLES_THRESHOLD,
      PAGE_CONTEXT, STORE_PLAYTHROUGH_URL) {
    var playthrough = null;
    var expStopwatch = null;
    var isLearnerInSamplePopulation = null;

    var multipleIncorrectStateName = {};

    var cycleIdentifier = {};
    var visitedStates = [];

    var misTracker = false;
    var cstTracker = false;

    var removeOldQuitAction = function() {
      var quitAction = playthrough.actions[playthrough.actions.length - 1];
      // After the second quit action is recorded, the first quit is removed
      // using this method. This ensures that there are only two quit actions
      // in the playthrough actions list at a time.
      playthrough.actions = playthrough.actions.filter(function(action) {
        return action.actionType !== ACTION_TYPE_EXPLORATION_QUIT;
      });
      playthrough.actions.push(quitAction);
    };

    var _determineIfLearnerIsInSamplePopulation = function(probability) {
      return Math.random() < probability;
    };

    var createMultipleIncorrectIssueTracker = function(initStateName) {
      if (misTracker) {
        return;
      }
      multipleIncorrectStateName = {
        state_name: initStateName,
        num_times_incorrect: 0
      };
      misTracker = true;
    };

    var createCyclicIssueTracker = function(initStateName) {
      if (cstTracker) {
        return;
      }
      cycleIdentifier = {
        cycle: '',
        num_cycles: 0
      };
      visitedStates.unshift(initStateName);
      cstTracker = true;
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
          var cycleString = visitedStates.slice(
            cycleStartIndex, visitedStates.length
          ).toString();
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
      } else if (isCyclicStateTransitionsIssue()) {
        playthrough.issueType = ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS;
        playthrough.issueCustomizationArgs = {
          state_names: {
            value: cycleIdentifier.cycle.split(',')
          }
        };
      } else if (isEarlyQuitIssue(timeSpentInExpInSecs)) {
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
      }
    };

    var storePlaythrough = function(isNewPlaythrough) {
      var playthroughId = isNewPlaythrough ? null : playthrough.playthroughId;
      var promise = $http.post(getFullPlaythroughUrl(), {
        playthrough_data: playthrough.toBackendDict(),
        issue_schema_version: CURRENT_ISSUE_SCHEMA_VERSION,
        playthrough_id: playthroughId
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
      return UrlInterpolationService.interpolateUrl(STORE_PLAYTHROUGH_URL, {
        exploration_id: playthrough.expId
      });
    };

    var isPlaythroughDiscarded = function() {
      return !isLearnerInSamplePopulation ||
        !PlaythroughIssuesService.isExplorationEligibleForPlaythroughIssues(
          playthrough.expId);
    };

    return {
      initSession: function(
          explorationId, explorationVersion, playthroughProbability) {
        isLearnerInSamplePopulation =
          _determineIfLearnerIsInSamplePopulation(playthroughProbability);
        playthrough = PlaythroughObjectFactory.createNew(
          null, explorationId, explorationVersion, null, {}, []);
        expStopwatch = StopwatchObjectFactory.create();
      },
      getPlaythrough: function() {
        return playthrough;
      },
      recordExplorationStartAction: function(initStateName) {
        if (isPlaythroughDiscarded()) {
          return;
        }
        var expStartLearnerAction = LearnerActionObjectFactory.createNew(
          ACTION_TYPE_EXPLORATION_START,
          {
            state_name: {
              value: initStateName
            }
          },
          CURRENT_ACTION_SCHEMA_VERSION);

        playthrough.actions.unshift(expStartLearnerAction);

        createMultipleIncorrectIssueTracker(initStateName);

        createCyclicIssueTracker(initStateName);

        expStopwatch.reset();
      },
      recordAnswerSubmitAction: function(
          stateName, destStateName, interactionId, answer, feedback,
          timeSpentInStateSecs) {
        if (isPlaythroughDiscarded()) {
          return;
        }
        if (!cstTracker) {
          createCyclicIssueTracker(stateName);
        }
        if (!misTracker) {
          createMultipleIncorrectIssueTracker(stateName);
        }
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
            submitted_answer: {
              value: answer
            },
            feedback: {
              value: feedback
            },
            time_spent_state_in_msecs: {
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
        if (isPlaythroughDiscarded()) {
          return;
        }
        playthrough.actions.push(LearnerActionObjectFactory.createNew(
          ACTION_TYPE_EXPLORATION_QUIT,
          {
            state_name: {
              value: stateName
            },
            time_spent_in_state_in_msecs: {
              value: timeSpentInStateSecs
            }
          },
          CURRENT_ACTION_SCHEMA_VERSION
        ));
      },
      recordPlaythrough: function(isExplorationComplete) {
        if (isPlaythroughDiscarded()) {
          return;
        }
        if (isExplorationComplete) {
          // If the exploration is completed, do not check for issues.
          return;
        }
        if (playthrough.playthroughId) {
          // Playthrough ID exists, so issue has already been identified.
          removeOldQuitAction();
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
