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

oppia.constant('STATS_EVENT_TYPES', {
  EVENT_TYPE_START_EXPLORATION: 'start',
  EVENT_TYPE_ACTUAL_START_EXPLORATION: 'actual_start',
  EVENT_TYPE_COMPLETE_EXPLORATION: 'complete',
  EVENT_TYPE_STATE_HIT: 'state_hit',
  EVENT_TYPE_STATE_COMPLETED: 'state_complete',
  EVENT_TYPE_ANSWER_SUBMITTED: 'answer_submitted',
  EVENT_TYPE_SOLUTION_HIT: 'solution_hit',
  EVENT_TYPE_LEAVE_FOR_REFRESHER_EXP: 'leave_for_refresher_exp',
});

oppia.constant('STATS_REPORTING_URLS', {
  ANSWER_SUBMITTED: '/explorehandler/answer_submitted_event/<exploration_id>',
  EXPLORATION_COMPLETED: (
    '/explorehandler/exploration_complete_event/<exploration_id>'),
  EXPLORATION_MAYBE_LEFT: (
    '/explorehandler/exploration_maybe_leave_event/<exploration_id>'),
  EXPLORATION_STARTED: (
    '/explorehandler/exploration_start_event/<exploration_id>'),
  STATE_HIT: '/explorehandler/state_hit_event/<exploration_id>',
  STATE_COMPLETED: '/explorehandler/state_complete_event/<exploration_id>',
  EXPLORATION_ACTUALLY_STARTED: (
    '/explorehandler/exploration_actual_start_event/<exploration_id>'),
  SOLUTION_HIT: '/explorehandler/solution_hit_event/<exploration_id>',
  LEAVE_FOR_REFRESHER_EXP: (
    '/explorehandler/leave_for_refresher_exp_event/<exploration_id>'),
  STATS_EVENTS: '/explorehandler/stats_events/<exploration_id>'
});

oppia.factory('StatsReportingService', [
  '$http', '$interval', 'ContextService', 'MessengerService',
  'PlaythroughService', 'siteAnalyticsService', 'StopwatchObjectFactory',
  'UrlInterpolationService', 'DEFAULT_OUTCOME_CLASSIFICATION',
  'ENABLE_PLAYTHROUGH_RECORDING', 'PAGE_CONTEXT', 'STATS_EVENT_TYPES',
  'STATS_REPORTING_URLS',
  function(
      $http, $interval, ContextService, MessengerService,
      PlaythroughService, siteAnalyticsService, StopwatchObjectFactory,
      UrlInterpolationService, DEFAULT_OUTCOME_CLASSIFICATION,
      ENABLE_PLAYTHROUGH_RECORDING, PAGE_CONTEXT, STATS_EVENT_TYPES,
      STATS_REPORTING_URLS) {
    var explorationId = null;
    var explorationTitle = null;
    var explorationVersion = null;
    var sessionId = null;
    var stateStopwatch = null;
    var optionalCollectionId = undefined;
    var statesVisited = {};
    var numStatesVisited = 0;
    var explorationIsComplete = false;

    var _editorPreviewMode = (
      ContextService.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR);

    // The following dict will contain all stats data accumulated over the
    // interval time and will be reset when the dict is sent to backend for
    // recording.
    var aggregatedStats = {};

    var refreshAggregatedStats = function() {
      aggregatedStats = {
        num_starts: 0,
        num_completions: 0,
        num_actual_starts: 0,
        state_stats_mapping: {}
      };
    };

    var createDefaultStateStatsMapping = function(stateName) {
      aggregatedStats.state_stats_mapping[stateName] = {
        total_answers_count: 0,
        useful_feedback_count: 0,
        total_hit_count: 0,
        first_hit_count: 0,
        num_times_solution_viewed: 0,
        num_completions: 0
      };
    };

    var getFullStatsUrl = function(urlIdentifier) {
      return UrlInterpolationService.interpolateUrl(
        STATS_REPORTING_URLS[urlIdentifier], {
          exploration_id: explorationId
        });
    };

    if (!_editorPreviewMode) {
      $interval(function() {
        postStatsToBackend();
      }, 300000);
    }

    // This method is called whenever a learner tries to leave an exploration,
    // when a learner starts an exploration, when a learner completes an
    // exploration and also every five minutes.
    var postStatsToBackend = function() {
      $http.post(getFullStatsUrl('STATS_EVENTS'), {
        aggregated_stats: aggregatedStats,
        exp_version: explorationVersion
      });
      refreshAggregatedStats();
    };

    return {
      initSession: function(
          newExplorationId, newExplorationTitle, newExplorationVersion,
          newSessionId, collectionId) {
        explorationId = newExplorationId;
        explorationTitle = newExplorationTitle;
        explorationVersion = newExplorationVersion;
        sessionId = newSessionId;
        stateStopwatch = StopwatchObjectFactory.create();
        optionalCollectionId = collectionId;
        refreshAggregatedStats();
      },
      // Note that this also resets the stateStopwatch.
      recordExplorationStarted: function(stateName, params) {
        aggregatedStats.num_starts += 1;

        createDefaultStateStatsMapping(stateName);
        aggregatedStats.state_stats_mapping[stateName].total_hit_count += 1;
        aggregatedStats.state_stats_mapping[stateName].first_hit_count += 1;

        postStatsToBackend();

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
          session_id: sessionId,
        });

        MessengerService.sendMessage(MessengerService.EXPLORATION_LOADED, {
          explorationVersion: explorationVersion,
          explorationTitle: explorationTitle
        });

        statesVisited[stateName] = true;
        numStatesVisited = 1;
        siteAnalyticsService.registerNewCard(1);

        stateStopwatch.reset();
      },
      recordExplorationActuallyStarted: function(stateName) {
        aggregatedStats.num_actual_starts += 1;
        $http.post(getFullStatsUrl('EXPLORATION_ACTUALLY_STARTED'), {
          exploration_version: explorationVersion,
          state_name: stateName,
          session_id: sessionId
        });

        if (ENABLE_PLAYTHROUGH_RECORDING) {
          PlaythroughService.recordExplorationStartAction(stateName);
        }
      },
      recordSolutionHit: function(stateName) {
        if (!aggregatedStats.state_stats_mapping.hasOwnProperty(stateName)) {
          createDefaultStateStatsMapping(stateName);
        }
        aggregatedStats.state_stats_mapping[
          stateName].num_times_solution_viewed += 1;

        $http.post(getFullStatsUrl('SOLUTION_HIT'), {
          exploration_version: explorationVersion,
          state_name: stateName,
          session_id: sessionId,
          time_spent_in_state_secs: stateStopwatch.getTimeInSecs()
        });
      },
      recordLeaveForRefresherExp: function(stateName, refresherExpId) {
        $http.post(getFullStatsUrl('LEAVE_FOR_REFRESHER_EXP'), {
          exploration_version: explorationVersion,
          refresher_exp_id: refresherExpId,
          state_name: stateName,
          session_id: sessionId,
          time_spent_in_state_secs: stateStopwatch.getTimeInSecs()
        });
      },
      // Note that this also resets the stateStopwatch.
      recordStateTransition: function(
          oldStateName, newStateName, answer, oldParams, isFirstHit) {
        if (!aggregatedStats.state_stats_mapping.hasOwnProperty(newStateName)) {
          createDefaultStateStatsMapping(newStateName);
        }
        aggregatedStats.state_stats_mapping[newStateName].total_hit_count += 1;
        if (isFirstHit) {
          aggregatedStats.state_stats_mapping[
            newStateName].first_hit_count += 1;
        }

        $http.post(getFullStatsUrl('STATE_HIT'), {
          // This is the time spent since the last submission.
          client_time_spent_in_secs: stateStopwatch.getTimeInSecs(),
          exploration_version: explorationVersion,
          new_state_name: newStateName,
          old_params: oldParams,
          session_id: sessionId,
        });

        // Broadcast information about the state transition to listeners.
        MessengerService.sendMessage(MessengerService.STATE_TRANSITION, {
          explorationVersion: explorationVersion,
          jsonAnswer: JSON.stringify(answer),
          newStateName: newStateName,
          oldStateName: oldStateName,
          paramValues: oldParams
        });

        if (!statesVisited.hasOwnProperty(newStateName)) {
          statesVisited[newStateName] = true;
          numStatesVisited++;
          siteAnalyticsService.registerNewCard(numStatesVisited);
        }

        stateStopwatch.reset();
      },
      recordStateCompleted: function(stateName) {
        if (!aggregatedStats.state_stats_mapping.hasOwnProperty(stateName)) {
          createDefaultStateStatsMapping(stateName);
        }
        aggregatedStats.state_stats_mapping[stateName].num_completions += 1;

        $http.post(getFullStatsUrl('STATE_COMPLETED'), {
          exp_version: explorationVersion,
          state_name: stateName,
          session_id: sessionId,
          time_spent_in_state_secs: stateStopwatch.getTimeInSecs()
        });
      },
      recordExplorationCompleted: function(stateName, params) {
        aggregatedStats.num_completions += 1;
        $http.post(getFullStatsUrl('EXPLORATION_COMPLETED'), {
          client_time_spent_in_secs: stateStopwatch.getTimeInSecs(),
          collection_id: optionalCollectionId,
          params: params,
          session_id: sessionId,
          state_name: stateName,
          version: explorationVersion
        });

        MessengerService.sendMessage(MessengerService.EXPLORATION_COMPLETED, {
          explorationVersion: explorationVersion,
          paramValues: params
        });

        siteAnalyticsService.registerFinishExploration();
        explorationIsComplete = true;

        postStatsToBackend();
        if (ENABLE_PLAYTHROUGH_RECORDING) {
          PlaythroughService.recordExplorationQuitAction(
            stateName, stateStopwatch.getTimeInSecs());

          PlaythroughService.recordPlaythrough(true);
        }
      },
      recordAnswerSubmitted: function(
          stateName, params, answer, answerGroupIndex, ruleIndex,
          classificationCategorization, feedbackIsUseful) {
        if (!aggregatedStats.state_stats_mapping.hasOwnProperty(stateName)) {
          createDefaultStateStatsMapping(stateName);
        }
        aggregatedStats.state_stats_mapping[stateName].total_answers_count += 1;
        if (feedbackIsUseful) {
          aggregatedStats.state_stats_mapping[
            stateName].useful_feedback_count += 1;
        }
        $http.post(getFullStatsUrl('ANSWER_SUBMITTED'), {
          answer: answer,
          params: params,
          version: explorationVersion,
          session_id: sessionId,
          client_time_spent_in_secs: stateStopwatch.getTimeInSecs(),
          old_state_name: stateName,
          answer_group_index: answerGroupIndex,
          rule_spec_index: ruleIndex,
          classification_categorization: classificationCategorization
        });
      },
      recordMaybeLeaveEvent: function(stateName, params) {
        $http.post(getFullStatsUrl('EXPLORATION_MAYBE_LEFT'), {
          client_time_spent_in_secs: stateStopwatch.getTimeInSecs(),
          collection_id: optionalCollectionId,
          params: params,
          session_id: sessionId,
          state_name: stateName,
          version: explorationVersion
        });

        postStatsToBackend();

        if (ENABLE_PLAYTHROUGH_RECORDING) {
          PlaythroughService.recordPlaythrough();
        }
      },
      recordAnswerSubmitAction: function(
          stateName, destStateName, interactionId, answer, feedback) {
        if (ENABLE_PLAYTHROUGH_RECORDING) {
          PlaythroughService.recordAnswerSubmitAction(
            stateName, destStateName, interactionId, answer, feedback,
            stateStopwatch.getTimeInSecs());
        }
      }
    };
  }
]);
