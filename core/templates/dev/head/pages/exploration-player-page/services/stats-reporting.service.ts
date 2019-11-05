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

require('domain/utilities/StopwatchObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');
require('services/context.service.ts');
require('services/messenger.service.ts');
require('services/playthrough.service.ts');
require('services/site-analytics.service.ts');

require(
  'pages/exploration-player-page/exploration-player-page.constants.ajs.ts');

angular.module('oppia').factory('StatsReportingService', [
  '$http', '$interval', 'ContextService', 'MessengerService',
  'PlaythroughService', 'SiteAnalyticsService', 'StopwatchObjectFactory',
  'UrlInterpolationService', 'STATS_REPORTING_URLS',
  function(
      $http, $interval, ContextService, MessengerService,
      PlaythroughService, SiteAnalyticsService, StopwatchObjectFactory,
      UrlInterpolationService, STATS_REPORTING_URLS) {
    var explorationId = null;
    var explorationTitle = null;
    var explorationVersion = null;
    var sessionId = null;
    var stateStopwatch = null;
    var optionalCollectionId = undefined;
    var statesVisited = {};
    var numStatesVisited = 0;
    var explorationStarted = false;
    var explorationActuallyStarted = false;
    var explorationIsComplete = false;
    var currentStateName = null;
    var nextExpId = null;
    var previousStateName = null;
    var nextStateName = null;

    var _editorPreviewMode = ContextService.isInExplorationEditorPage();
    var _questionPlayerMode = ContextService.isInQuestionPlayerMode();

    // The following dict will contain all stats data accumulated over the
    // interval time and will be reset when the dict is sent to backend for
    // recording.
    var aggregatedStats = {
      num_starts: null,
      num_completions: null,
      num_actual_starts: null,
      state_stats_mapping: null
    };

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
      try {
        return UrlInterpolationService.interpolateUrl(
          STATS_REPORTING_URLS[urlIdentifier], {
            exploration_id: explorationId
          });
      } catch (e) {
        var additionalInfo = ('\nUndefined exploration id error debug logs:' +
          '\nThe event being recorded: ' + urlIdentifier +
          '\nExploration ID: ' + ContextService.getExplorationId()
        );
        if (currentStateName) {
          additionalInfo += ('\nCurrent State name: ' + currentStateName);
        }
        if (nextExpId) {
          additionalInfo += ('\nRefresher exp id: ' + nextExpId);
        }
        if (previousStateName && nextStateName) {
          additionalInfo += ('\nOld State name: ' + previousStateName +
            '\nNew State name: ' + nextStateName);
        }
        e.message += additionalInfo;
        throw e;
      }
    };

    var startStatsTimer = function() {
      if (!_editorPreviewMode && !_questionPlayerMode ) {
        $interval(function() {
          postStatsToBackend();
        }, 300000);
      }
    };

    // This method is called whenever a learner tries to leave an exploration,
    // when a learner starts an exploration, when a learner completes an
    // exploration and also every five minutes.
    var postStatsToBackend = function() {
      if (explorationIsComplete) {
        return;
      }
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
        startStatsTimer();
      },
      // Note that this also resets the stateStopwatch.
      recordExplorationStarted: function(stateName, params) {
        if (explorationStarted) {
          return;
        }
        aggregatedStats.num_starts += 1;

        createDefaultStateStatsMapping(stateName);
        aggregatedStats.state_stats_mapping[stateName].total_hit_count += 1;
        aggregatedStats.state_stats_mapping[stateName].first_hit_count += 1;

        postStatsToBackend();

        currentStateName = stateName;
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
        SiteAnalyticsService.registerNewCard(1);

        stateStopwatch.reset();
        explorationStarted = true;
      },
      recordExplorationActuallyStarted: function(stateName) {
        if (explorationActuallyStarted) {
          return;
        }
        aggregatedStats.num_actual_starts += 1;
        currentStateName = stateName;
        $http.post(getFullStatsUrl('EXPLORATION_ACTUALLY_STARTED'), {
          exploration_version: explorationVersion,
          state_name: stateName,
          session_id: sessionId
        });

        PlaythroughService.recordExplorationStartAction(stateName);
        explorationActuallyStarted = true;
      },
      recordSolutionHit: function(stateName) {
        if (!aggregatedStats.state_stats_mapping.hasOwnProperty(stateName)) {
          createDefaultStateStatsMapping(stateName);
        }
        aggregatedStats.state_stats_mapping[
          stateName].num_times_solution_viewed += 1;
        currentStateName = stateName;
        $http.post(getFullStatsUrl('SOLUTION_HIT'), {
          exploration_version: explorationVersion,
          state_name: stateName,
          session_id: sessionId,
          time_spent_in_state_secs: stateStopwatch.getTimeInSecs()
        });
      },
      recordLeaveForRefresherExp: function(stateName, refresherExpId) {
        currentStateName = stateName;
        nextExpId = refresherExpId;
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

        previousStateName = oldStateName;
        nextStateName = newStateName;
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
          SiteAnalyticsService.registerNewCard(numStatesVisited);
        }

        stateStopwatch.reset();
      },
      recordStateCompleted: function(stateName) {
        if (!aggregatedStats.state_stats_mapping.hasOwnProperty(stateName)) {
          createDefaultStateStatsMapping(stateName);
        }
        aggregatedStats.state_stats_mapping[stateName].num_completions += 1;

        currentStateName = stateName;
        $http.post(getFullStatsUrl('STATE_COMPLETED'), {
          exp_version: explorationVersion,
          state_name: stateName,
          session_id: sessionId,
          time_spent_in_state_secs: stateStopwatch.getTimeInSecs()
        });
      },
      recordExplorationCompleted: function(stateName, params) {
        aggregatedStats.num_completions += 1;
        currentStateName = stateName;
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

        SiteAnalyticsService.registerFinishExploration();

        postStatsToBackend();
        PlaythroughService.recordExplorationQuitAction(
          stateName, stateStopwatch.getTimeInSecs());

        PlaythroughService.recordPlaythrough(true);
        explorationIsComplete = true;
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
        currentStateName = stateName;
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
        currentStateName = stateName;
        $http.post(getFullStatsUrl('EXPLORATION_MAYBE_LEFT'), {
          client_time_spent_in_secs: stateStopwatch.getTimeInSecs(),
          collection_id: optionalCollectionId,
          params: params,
          session_id: sessionId,
          state_name: stateName,
          version: explorationVersion
        });

        postStatsToBackend();

        PlaythroughService.recordExplorationQuitAction(
          stateName, stateStopwatch.getTimeInSecs());
        PlaythroughService.recordPlaythrough();
      },
      recordAnswerSubmitAction: function(
          stateName, destStateName, interactionId, answer, feedback) {
        PlaythroughService.recordAnswerSubmitAction(
          stateName, destStateName, interactionId, answer, feedback,
          stateStopwatch.getTimeInSecs());
      }
    };
  }
]);
