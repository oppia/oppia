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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ContextService } from 'services/context.service';
import { ExplorationPlayerConstants } from
  'pages/exploration-player-page/exploration-player-page.constants';
import { MessengerService } from 'services/messenger.service';
import { PlaythroughService } from 'services/playthrough.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { Stopwatch, StopwatchObjectFactory } from
  'domain/utilities/StopwatchObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

interface IStateStats {
  /* eslint-disable camelcase */
  total_answers_count: number;
  useful_feedback_count: number;
  total_hit_count: number;
  first_hit_count: number;
  num_times_solution_viewed: number;
  num_completions: number;
  /* eslint-enable camelcase */
}
interface IAggregatedStats {
  /* eslint-disable camelcase */
  num_starts: number;
  num_completions: number;
  num_actual_starts: number;
  state_stats_mapping: {[stateName: string]: IStateStats};
  /* eslint-enable camelcase */
}

@Injectable({
  providedIn: 'root'
})
export class StatsReportingService {
  constructor(
      private contextService: ContextService,
      private http: HttpClient,
      private messengerService: MessengerService,
      private playthroughService: PlaythroughService,
      private siteAnalyticsService: SiteAnalyticsService,
      private stopwatchObjectFactory: StopwatchObjectFactory,
      private urlInterpolationService: UrlInterpolationService) {
    this.editorPreviewMode = (
      this.contextService.isInExplorationEditorPage());
    this.questionPlayerMode = this.contextService.isInQuestionPlayerMode();
    this.refreshAggregatedStats();
  }

  explorationId: string = null;
  explorationTitle: string = null;
  explorationVersion: number = null;
  sessionId: string = null;
  stateStopwatch: Stopwatch = null;
  optionalCollectionId: string = null;
  statesVisited: Set<string> = new Set();
  explorationStarted: boolean = false;
  explorationActuallyStarted: boolean = false;
  explorationIsComplete: boolean = false;
  currentStateName: string = null;
  nextExpId: string = null;
  previousStateName: string = null;
  nextStateName: string = null;
  private editorPreviewMode: boolean = null;
  private questionPlayerMode: boolean = null;

  // The following dict will contain all stats data accumulated over the
  // interval time and will be reset when the dict is sent to backend for
  // recording.
  aggregatedStats: IAggregatedStats = null;

  private refreshAggregatedStats(): void {
    this.aggregatedStats = {
      num_starts: 0,
      num_completions: 0,
      num_actual_starts: 0,
      state_stats_mapping: {}
    };
  }

  private createDefaultStateStatsMappingIfMissing(stateName: string): void {
    if (this.aggregatedStats.state_stats_mapping.hasOwnProperty(stateName)) {
      return;
    }
    this.aggregatedStats.state_stats_mapping[stateName] = {
      total_answers_count: 0,
      useful_feedback_count: 0,
      total_hit_count: 0,
      first_hit_count: 0,
      num_times_solution_viewed: 0,
      num_completions: 0
    };
  }

  // TODO(#8038): Move this into a backend-api.service.
  private getFullStatsUrl(urlIdentifier: string): string {
    try {
      return this.urlInterpolationService.interpolateUrl(
        ExplorationPlayerConstants.STATS_REPORTING_URLS[urlIdentifier], {
          exploration_id: this.explorationId
        });
    } catch (e) {
      var additionalInfo = ('\nUndefined exploration id error debug logs:' +
        '\nThe event being recorded: ' + urlIdentifier +
        '\nExploration ID: ' + this.contextService.getExplorationId()
      );
      if (this.currentStateName) {
        additionalInfo += ('\nCurrent State name: ' + this.currentStateName);
      }
      if (this.nextExpId) {
        additionalInfo += ('\nRefresher exp id: ' + this.nextExpId);
      }
      if (this.previousStateName && this.nextStateName) {
        additionalInfo += ('\nOld State name: ' + this.previousStateName +
          '\nNew State name: ' + this.nextStateName);
      }
      e.message += additionalInfo;
      throw e;
    }
  }

  private startStatsTimer(): void {
    if (!this.editorPreviewMode && !this.questionPlayerMode ) {
      setInterval(() => this.postStatsToBackend(), 300000);
    }
  }

  // This method is called whenever a learner tries to leave an exploration,
  // when a learner starts an exploration, when a learner completes an
  // exploration and also every five minutes.
  private postStatsToBackend(): void {
    if (this.explorationIsComplete) {
      return;
    }
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('STATS_EVENTS'), {
      aggregated_stats: this.aggregatedStats,
      exp_version: this.explorationVersion
    });
    this.refreshAggregatedStats();
  }

  initSession(
      newExplorationId: string, newExplorationTitle: string,
      newExplorationVersion: number, newSessionId: string,
      collectionId: string): void {
    this.explorationId = newExplorationId;
    this.explorationTitle = newExplorationTitle;
    this.explorationVersion = newExplorationVersion;
    this.sessionId = newSessionId;
    this.stateStopwatch = this.stopwatchObjectFactory.create();
    this.optionalCollectionId = collectionId;
    this.refreshAggregatedStats();
    this.startStatsTimer();
  }

  // Note that this also resets the stateStopwatch.
  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordExplorationStarted(stateName: string, params: Object): void {
    if (this.explorationStarted) {
      return;
    }
    this.aggregatedStats.num_starts += 1;

    this.createDefaultStateStatsMappingIfMissing(stateName);
    this.aggregatedStats.state_stats_mapping[stateName].total_hit_count += 1;
    this.aggregatedStats.state_stats_mapping[stateName].first_hit_count += 1;

    this.postStatsToBackend();

    this.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('EXPLORATION_STARTED'), {
      params: params,
      session_id: this.sessionId,
      state_name: stateName,
      version: this.explorationVersion
    });

    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('STATE_HIT'), {
      client_time_spent_in_secs: 0.0,
      exploration_version: this.explorationVersion,
      new_state_name: stateName,
      old_params: params,
      session_id: this.sessionId,
    });

    this.messengerService.sendMessage(
      this.messengerService.EXPLORATION_LOADED, {
        explorationVersion: this.explorationVersion,
        explorationTitle: this.explorationTitle
      });

    this.statesVisited.add(stateName);
    this.siteAnalyticsService.registerNewCard(1);

    this.stateStopwatch.reset();
    this.explorationStarted = true;
  }

  recordExplorationActuallyStarted(stateName: string): void {
    if (this.explorationActuallyStarted) {
      return;
    }
    this.aggregatedStats.num_actual_starts += 1;
    this.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('EXPLORATION_ACTUALLY_STARTED'), {
      exploration_version: this.explorationVersion,
      state_name: stateName,
      session_id: this.sessionId
    });

    this.playthroughService.recordExplorationStartAction(stateName);
    this.explorationActuallyStarted = true;
  }

  recordSolutionHit(stateName: string): void {
    this.createDefaultStateStatsMappingIfMissing(stateName);
    this.aggregatedStats.state_stats_mapping[
      stateName].num_times_solution_viewed += 1;
    this.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('SOLUTION_HIT'), {
      exploration_version: this.explorationVersion,
      state_name: stateName,
      session_id: this.sessionId,
      time_spent_in_state_secs: this.stateStopwatch.getTimeInSecs()
    });
  }

  recordLeaveForRefresherExp(
      stateName: string, refresherExpId: string): void {
    this.currentStateName = stateName;
    this.nextExpId = refresherExpId;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('LEAVE_FOR_REFRESHER_EXP'), {
      exploration_version: this.explorationVersion,
      refresher_exp_id: refresherExpId,
      state_name: stateName,
      session_id: this.sessionId,
      time_spent_in_state_secs: this.stateStopwatch.getTimeInSecs()
    });
  }

  // Note that this also resets the stateStopwatch.
  // The type of oldParams is declared as Object since it can vary depending
  // on the oldStateName.
  recordStateTransition(
      oldStateName: string, newStateName: string, answer: string,
      oldParams: Object, isFirstHit: boolean): void {
    this.createDefaultStateStatsMappingIfMissing(newStateName);
    this.aggregatedStats.state_stats_mapping[
      newStateName].total_hit_count += 1;
    if (isFirstHit) {
      this.aggregatedStats.state_stats_mapping[
        newStateName].first_hit_count += 1;
    }

    this.previousStateName = oldStateName;
    this.nextStateName = newStateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('STATE_HIT'), {
      // This is the time spent since the last submission.
      client_time_spent_in_secs: this.stateStopwatch.getTimeInSecs(),
      exploration_version: this.explorationVersion,
      new_state_name: newStateName,
      old_params: oldParams,
      session_id: this.sessionId,
    });

    // Broadcast information about the state transition to listeners.
    this.messengerService.sendMessage(
      this.messengerService.STATE_TRANSITION, {
        explorationVersion: this.explorationVersion,
        jsonAnswer: JSON.stringify(answer),
        newStateName: newStateName,
        oldStateName: oldStateName,
        paramValues: oldParams
      });

    if (!this.statesVisited.has(newStateName)) {
      this.statesVisited.add(newStateName);
      this.siteAnalyticsService.registerNewCard(this.statesVisited.size);
    }

    this.stateStopwatch.reset();
  }

  recordStateCompleted(stateName: string): void {
    this.createDefaultStateStatsMappingIfMissing(stateName);
    this.aggregatedStats.state_stats_mapping[stateName].num_completions += 1;

    this.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('STATE_COMPLETED'), {
      exp_version: this.explorationVersion,
      state_name: stateName,
      session_id: this.sessionId,
      time_spent_in_state_secs: this.stateStopwatch.getTimeInSecs()
    });
  }

  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordExplorationCompleted(stateName: string, params: Object): void {
    this.aggregatedStats.num_completions += 1;
    this.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('EXPLORATION_COMPLETED'), {
      client_time_spent_in_secs: this.stateStopwatch.getTimeInSecs(),
      collection_id: this.optionalCollectionId,
      params: params,
      session_id: this.sessionId,
      state_name: stateName,
      version: this.explorationVersion
    });

    this.messengerService.sendMessage(
      this.messengerService.EXPLORATION_COMPLETED, {
        explorationVersion: this.explorationVersion,
        paramValues: params
      });

    this.siteAnalyticsService.registerFinishExploration();

    this.postStatsToBackend();
    this.playthroughService.recordExplorationQuitAction(
      stateName, this.stateStopwatch.getTimeInSecs());

    this.playthroughService.recordPlaythrough(true);
    this.explorationIsComplete = true;
  }

  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordAnswerSubmitted(
      stateName: string, params: Object, answer: string,
      answerGroupIndex: number, ruleIndex: number,
      classificationCategorization: string, feedbackIsUseful: boolean): void {
    this.createDefaultStateStatsMappingIfMissing(stateName);
    this.aggregatedStats.state_stats_mapping[
      stateName].total_answers_count += 1;
    if (feedbackIsUseful) {
      this.aggregatedStats.state_stats_mapping[
        stateName].useful_feedback_count += 1;
    }
    this.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('ANSWER_SUBMITTED'), {
      answer: answer,
      params: params,
      version: this.explorationVersion,
      session_id: this.sessionId,
      client_time_spent_in_secs: this.stateStopwatch.getTimeInSecs(),
      old_state_name: stateName,
      answer_group_index: answerGroupIndex,
      rule_spec_index: ruleIndex,
      classification_categorization: classificationCategorization
    });
  }

  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordMaybeLeaveEvent(stateName: string, params: Object): void {
    this.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('EXPLORATION_MAYBE_LEFT'), {
      client_time_spent_in_secs: this.stateStopwatch.getTimeInSecs(),
      collection_id: this.optionalCollectionId,
      params: params,
      session_id: this.sessionId,
      state_name: stateName,
      version: this.explorationVersion
    });

    this.postStatsToBackend();

    this.playthroughService.recordExplorationQuitAction(
      stateName, this.stateStopwatch.getTimeInSecs());
    this.playthroughService.recordPlaythrough(false);
  }

  recordAnswerSubmitAction(
      stateName:string, destStateName: string,
      interactionId: string, answer: string, feedback: string): void {
    this.playthroughService.recordAnswerSubmitAction(
      stateName, destStateName, interactionId, answer, feedback,
      this.stateStopwatch.getTimeInSecs());
  }
}
angular.module('oppia').factory('StatsReportingService',
  downgradeInjectable(StatsReportingService));
