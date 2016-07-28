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
 * @fileoverview Services for stats reporting.
 */

oppia.constant('STATS_REPORTING_URLS', {
  ANSWER_SUBMITTED: '/explorehandler/answer_submitted_event/<exploration_id>',
  EXPLORATION_COMPLETED: (
    '/explorehandler/exploration_complete_event/<exploration_id>'),
  EXPLORATION_MAYBE_LEFT: (
    '/explorehandler/exploration_maybe_leave_event/<exploration_id>'),
  EXPLORATION_STARTED: (
    '/explorehandler/exploration_start_event/<exploration_id>'),
  STATE_HIT: '/explorehandler/state_hit_event/<exploration_id>'
});

oppia.factory('StatsReportingService', [
  '$http', 'StopwatchObjectFactory', 'messengerService',
  'UrlInterpolationService', 'STATS_REPORTING_URLS',
  function(
      $http, StopwatchObjectFactory, messengerService,
      UrlInterpolationService, STATS_REPORTING_URLS) {
    var explorationId = null;
    var explorationVersion = null;
    var sessionId = null;
    var stopwatch = null;
    var optionalCollectionId = undefined;

    var getFullStatsUrl = function(urlIdentifier) {
      return UrlInterpolationService.interpolateUrl(
        STATS_REPORTING_URLS[urlIdentifier], {
          exploration_id: explorationId
        });
    };

    return {
      initSession: function(
          newExplorationId, newExplorationVersion, newSessionId,
          collectionId) {
        explorationId = newExplorationId;
        explorationVersion = newExplorationVersion;
        sessionId = newSessionId;
        stopwatch = StopwatchObjectFactory.create();
        optionalCollectionId = collectionId;
      },
      // Note that this also resets the stopwatch.
      recordExplorationStarted: function(stateName, params) {
        $http.post(getFullStatsUrl('EXPLORATION_STARTED'), {
          params: params,
          session_id: sessionId,
          state_name: stateName,
          version: explorationVersion
        });

        $http.post(getFullStatsUrl('STATE_HIT'), {
          client_time_spent_in_secs: 0.0,
          exploration_version: explorationVersion,
          new_state_name: stateName,
          old_params: params,
          session_id: sessionId
        });

        messengerService.sendMessage(messengerService.EXPLORATION_LOADED, {
          explorationVersion: explorationVersion
        });

        stopwatch.reset();
      },
      // Note that this also resets the stopwatch.
      recordStateTransition: function(
          oldStateName, newStateName, answer, oldParams) {
        $http.post(getFullStatsUrl('STATE_HIT'), {
          // This is the time spent since the last submission.
          client_time_spent_in_secs: stopwatch.getTimeInSecs(),
          exploration_version: explorationVersion,
          new_state_name: newStateName,
          old_params: oldParams,
          session_id: sessionId
        });

        // Broadcast information about the state transition to listeners.
        messengerService.sendMessage(messengerService.STATE_TRANSITION, {
          explorationVersion: explorationVersion,
          jsonAnswer: JSON.stringify(answer),
          newStateName: newStateName,
          oldStateName: oldStateName,
          paramValues: oldParams
        });

        stopwatch.reset();
      },
      recordExplorationCompleted: function(stateName, params) {
        $http.post(getFullStatsUrl('EXPLORATION_COMPLETED'), {
          client_time_spent_in_secs: stopwatch.getTimeInSecs(),
          collection_id: optionalCollectionId,
          params: params,
          session_id: sessionId,
          state_name: stateName,
          version: explorationVersion
        });

        messengerService.sendMessage(messengerService.EXPLORATION_COMPLETED, {
          explorationVersion: explorationVersion,
          paramValues: params
        });
      },
      recordAnswerSubmitted: function(
          stateName, params, answer, answerGroupIndex, ruleSpecIndex) {
        $http.post(getFullStatsUrl('ANSWER_SUBMITTED'), {
          answer: answer,
          params: params,
          version: explorationVersion,
          old_state_name: stateName,
          answer_group_index: answerGroupIndex,
          rule_spec_index: ruleSpecIndex
        });
      },
      recordMaybeLeaveEvent: function(stateName, params) {
        $http.post(getFullStatsUrl('EXPLORATION_MAYBE_LEFT'), {
          client_time_spent_in_secs: stopwatch.getTimeInSecs(),
          params: params,
          session_id: sessionId,
          state_name: stateName,
          version: explorationVersion
        });
      }
    };
  }
]);
