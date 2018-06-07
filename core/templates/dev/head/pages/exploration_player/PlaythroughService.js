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
  'UrlInterpolationService',
  function(
      $http, PAGE_CONTEXT, PlaythroughObjectFactory, LearnerActionObjectFactory,
      STORE_PLAYTHROUGH_URL, UrlInterpolationService) {
    var playthrough = null;

    var analyzePlaythrough = function() {

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
      },
      recordExplorationStartAction: function(initStateName) {
        playthrough.actions.push(new LearnerActionObjectFactory(
          'ExplorationStart', CURRENT_LEARNER_ACTION_SCHEMA_VERSION,
          {
            state_name: {
              value: initStateName
            }
          }
        ));
      },
      recordAnswerSubmitAction: function(
          stateName, destStateName, interactionId, answer, feedback,
          timeSpentInStateSecs) {
        playthrough.actions.push(new LearnerActionObjectFactory(
          'AnswerSubmit', CURRENT_LEARNER_ACTION_SCHEMA_VERSION,
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
      },
      recordExplorationQuitAction: function(
          stateName, timeSpentInStateSecs) {
        playthrough.actions.push(new LearnerAction(
          'ExplorationQuit', CURRENT_LEARNER_ACTION_SCHEMA_VERSION,
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
