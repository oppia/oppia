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
  'total_answers_count': number;
  'useful_feedback_count': number;
  'total_hit_count': number;
  'first_hit_count': number;
  'num_times_solution_viewed': number;
  'num_completions': number;
}
interface IAggregatedStats {
  'num_starts': number;
  'num_completions': number;
  'num_actual_starts': number;
  'state_stats_mapping': {
    [stateName: string]: IStateStats
  };
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
    StatsReportingService.editorPreviewMode = (
      this.contextService.isInExplorationEditorPage());
    StatsReportingService.questionPlayerMode = (
      this.contextService.isInQuestionPlayerMode());
    this.refreshAggregatedStats();
  }

  static explorationId: string = null;
  static explorationTitle: string = null;
  static explorationVersion: number = null;
  static sessionId: string = null;
  static stateStopwatch: Stopwatch = null;
  static optionalCollectionId: string = null;
  static statesVisited: Set<string> = new Set();
  static explorationStarted: boolean = false;
  static explorationActuallyStarted: boolean = false;
  static explorationIsComplete: boolean = false;
  static currentStateName: string = null;
  static nextExpId: string = null;
  static previousStateName: string = null;
  static nextStateName: string = null;
  private static editorPreviewMode: boolean = null;
  private static questionPlayerMode: boolean = null;

  // The following dict will contain all stats data accumulated over the
  // interval time and will be reset when the dict is sent to backend for
  // recording.
  static aggregatedStats: IAggregatedStats = null;

  private refreshAggregatedStats(): void {
    StatsReportingService.aggregatedStats = {
      num_starts: 0,
      num_completions: 0,
      num_actual_starts: 0,
      state_stats_mapping: {}
    };
  }

  private createDefaultStateStatsMappingIfMissing(stateName: string): void {
    if (
      StatsReportingService.aggregatedStats.state_stats_mapping.hasOwnProperty(
        stateName)) {
      return;
    }
    StatsReportingService.aggregatedStats.state_stats_mapping[stateName] = {
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
          exploration_id: StatsReportingService.explorationId
        });
    } catch (e) {
      let additionalInfo = ('\nUndefined exploration id error debug logs:' +
        '\nThe event being recorded: ' + urlIdentifier +
        '\nExploration ID: ' + this.contextService.getExplorationId()
      );
      if (StatsReportingService.currentStateName) {
        additionalInfo += (
          '\nCurrent State name: ' + StatsReportingService.currentStateName);
      }
      if (StatsReportingService.nextExpId) {
        additionalInfo += (
          '\nRefresher exp id: ' + StatsReportingService.nextExpId);
      }
      if (
        StatsReportingService.previousStateName &&
        StatsReportingService.nextStateName) {
        additionalInfo += (
          '\nOld State name: ' + StatsReportingService.previousStateName +
          '\nNew State name: ' + StatsReportingService.nextStateName);
      }
      e.message += additionalInfo;
      throw e;
    }
  }

  private startStatsTimer(): void {
    if (!StatsReportingService.editorPreviewMode &&
      !StatsReportingService.questionPlayerMode ) {
      setInterval(() => this.postStatsToBackend(), 300000);
    }
  }

  // This method is called whenever a learner tries to leave an exploration,
  // when a learner starts an exploration, when a learner completes an
  // exploration and also every five minutes.
  private postStatsToBackend(): void {
    if (StatsReportingService.explorationIsComplete) {
      return;
    }
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('STATS_EVENTS'), {
      aggregated_stats: StatsReportingService.aggregatedStats,
      exp_version: StatsReportingService.explorationVersion
    }).toPromise().then(() => {
      // Required for the post operation to deliver data to backend.
    });
    this.refreshAggregatedStats();
  }

  initSession(
      newExplorationId: string, newExplorationTitle: string,
      newExplorationVersion: number, newSessionId: string,
      collectionId: string): void {
    StatsReportingService.explorationId = newExplorationId;
    StatsReportingService.explorationTitle = newExplorationTitle;
    StatsReportingService.explorationVersion = newExplorationVersion;
    StatsReportingService.sessionId = newSessionId;
    StatsReportingService.stateStopwatch = this.stopwatchObjectFactory.create();
    StatsReportingService.optionalCollectionId = collectionId;
    this.refreshAggregatedStats();
    this.startStatsTimer();
  }

  // Note that this also resets the stateStopwatch.
  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordExplorationStarted(stateName: string, params: Object): void {
    if (StatsReportingService.explorationStarted) {
      return;
    }
    StatsReportingService.aggregatedStats.num_starts += 1;

    this.createDefaultStateStatsMappingIfMissing(stateName);
    StatsReportingService.aggregatedStats.state_stats_mapping[
      stateName].total_hit_count += 1;
    StatsReportingService.aggregatedStats.state_stats_mapping[
      stateName].first_hit_count += 1;

    this.postStatsToBackend();

    StatsReportingService.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('EXPLORATION_STARTED'), {
      params: params,
      session_id: StatsReportingService.sessionId,
      state_name: stateName,
      version: StatsReportingService.explorationVersion
    }).toPromise().then(() => {
      // Required for the post operation to deliver data to backend.
    });

    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('STATE_HIT'), {
      client_time_spent_in_secs: 0.0,
      exploration_version: StatsReportingService.explorationVersion,
      new_state_name: stateName,
      old_params: params,
      session_id: StatsReportingService.sessionId,
    }).toPromise().then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.messengerService.sendMessage(
      this.messengerService.EXPLORATION_LOADED, {
        explorationVersion: StatsReportingService.explorationVersion,
        explorationTitle: StatsReportingService.explorationTitle
      });

    StatsReportingService.statesVisited.add(stateName);
    this.siteAnalyticsService.registerNewCard(1);

    StatsReportingService.stateStopwatch.reset();
    StatsReportingService.explorationStarted = true;
  }

  recordExplorationActuallyStarted(stateName: string): void {
    if (StatsReportingService.explorationActuallyStarted) {
      return;
    }
    StatsReportingService.aggregatedStats.num_actual_starts += 1;
    StatsReportingService.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('EXPLORATION_ACTUALLY_STARTED'), {
      exploration_version: StatsReportingService.explorationVersion,
      state_name: stateName,
      session_id: StatsReportingService.sessionId
    }).toPromise().then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.playthroughService.recordExplorationStartAction(stateName);
    StatsReportingService.explorationActuallyStarted = true;
  }

  recordSolutionHit(stateName: string): void {
    this.createDefaultStateStatsMappingIfMissing(stateName);
    StatsReportingService.aggregatedStats.state_stats_mapping[
      stateName].num_times_solution_viewed += 1;
    StatsReportingService.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('SOLUTION_HIT'), {
      exploration_version: StatsReportingService.explorationVersion,
      state_name: stateName,
      session_id: StatsReportingService.sessionId,
      time_spent_in_state_secs: (
        StatsReportingService.stateStopwatch.getTimeInSecs())
    }).toPromise().then(() => {
      // Required for the post operation to deliver data to backend.
    });
  }

  recordLeaveForRefresherExp(
      stateName: string, refresherExpId: string): void {
    StatsReportingService.currentStateName = stateName;
    StatsReportingService.nextExpId = refresherExpId;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('LEAVE_FOR_REFRESHER_EXP'), {
      exploration_version: StatsReportingService.explorationVersion,
      refresher_exp_id: refresherExpId,
      state_name: stateName,
      session_id: StatsReportingService.sessionId,
      time_spent_in_state_secs: (
        StatsReportingService.stateStopwatch.getTimeInSecs())
    }).toPromise().then(() => {
      // Required for the post operation to deliver data to backend.
    });
  }

  // Note that this also resets the stateStopwatch.
  // The type of oldParams is declared as Object since it can vary depending
  // on the oldStateName.
  recordStateTransition(
      oldStateName: string, newStateName: string, answer: string,
      oldParams: Object, isFirstHit: boolean): void {
    this.createDefaultStateStatsMappingIfMissing(newStateName);
    StatsReportingService.aggregatedStats.state_stats_mapping[
      newStateName].total_hit_count += 1;
    if (isFirstHit) {
      StatsReportingService.aggregatedStats.state_stats_mapping[
        newStateName].first_hit_count += 1;
    }

    StatsReportingService.previousStateName = oldStateName;
    StatsReportingService.nextStateName = newStateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('STATE_HIT'), {
      // This is the time spent since the last submission.
      client_time_spent_in_secs: (
        StatsReportingService.stateStopwatch.getTimeInSecs()),
      exploration_version: StatsReportingService.explorationVersion,
      new_state_name: newStateName,
      old_params: oldParams,
      session_id: StatsReportingService.sessionId,
    }).toPromise().then(() => {
      // Required for the post operation to deliver data to backend.
    });

    // Broadcast information about the state transition to listeners.
    this.messengerService.sendMessage(
      this.messengerService.STATE_TRANSITION, {
        explorationVersion: StatsReportingService.explorationVersion,
        jsonAnswer: JSON.stringify(answer),
        newStateName: newStateName,
        oldStateName: oldStateName,
        paramValues: oldParams
      });

    if (!StatsReportingService.statesVisited.has(newStateName)) {
      StatsReportingService.statesVisited.add(newStateName);
      this.siteAnalyticsService.registerNewCard(
        StatsReportingService.statesVisited.size);
    }

    StatsReportingService.stateStopwatch.reset();
  }

  recordStateCompleted(stateName: string): void {
    this.createDefaultStateStatsMappingIfMissing(stateName);
    StatsReportingService.aggregatedStats.state_stats_mapping[
      stateName].num_completions += 1;

    StatsReportingService.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('STATE_COMPLETED'), {
      exp_version: StatsReportingService.explorationVersion,
      state_name: stateName,
      session_id: StatsReportingService.sessionId,
      time_spent_in_state_secs: (
        StatsReportingService.stateStopwatch.getTimeInSecs())
    }).toPromise().then(() => {
      // Required for the post operation to deliver data to backend.
    });
  }

  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordExplorationCompleted(stateName: string, params: Object): void {
    StatsReportingService.aggregatedStats.num_completions += 1;
    StatsReportingService.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('EXPLORATION_COMPLETED'), {
      client_time_spent_in_secs: (
        StatsReportingService.stateStopwatch.getTimeInSecs()),
      collection_id: StatsReportingService.optionalCollectionId,
      params: params,
      session_id: StatsReportingService.sessionId,
      state_name: stateName,
      version: StatsReportingService.explorationVersion
    }).toPromise().then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.messengerService.sendMessage(
      this.messengerService.EXPLORATION_COMPLETED, {
        explorationVersion: StatsReportingService.explorationVersion,
        paramValues: params
      });

    this.siteAnalyticsService.registerFinishExploration();

    this.postStatsToBackend();
    this.playthroughService.recordExplorationQuitAction(
      stateName, StatsReportingService.stateStopwatch.getTimeInSecs());

    this.playthroughService.recordPlaythrough(true);
    StatsReportingService.explorationIsComplete = true;
  }

  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordAnswerSubmitted(
      stateName: string, params: Object, answer: string,
      answerGroupIndex: number, ruleIndex: number,
      classificationCategorization: string, feedbackIsUseful: boolean): void {
    this.createDefaultStateStatsMappingIfMissing(stateName);
    StatsReportingService.aggregatedStats.state_stats_mapping[
      stateName].total_answers_count += 1;
    if (feedbackIsUseful) {
      StatsReportingService.aggregatedStats.state_stats_mapping[
        stateName].useful_feedback_count += 1;
    }
    StatsReportingService.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('ANSWER_SUBMITTED'), {
      answer: answer,
      params: params,
      version: StatsReportingService.explorationVersion,
      session_id: StatsReportingService.sessionId,
      client_time_spent_in_secs: (
        StatsReportingService.stateStopwatch.getTimeInSecs()),
      old_state_name: stateName,
      answer_group_index: answerGroupIndex,
      rule_spec_index: ruleIndex,
      classification_categorization: classificationCategorization
    }).toPromise().then(() => {
      // Required for the post operation to deliver data to backend.
    });
  }

  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordMaybeLeaveEvent(stateName: string, params: Object): void {
    StatsReportingService.currentStateName = stateName;
    // TODO(#8038): Move this into a backend-api.service.
    this.http.post(this.getFullStatsUrl('EXPLORATION_MAYBE_LEFT'), {
      client_time_spent_in_secs: (
        StatsReportingService.stateStopwatch.getTimeInSecs()),
      collection_id: StatsReportingService.optionalCollectionId,
      params: params,
      session_id: StatsReportingService.sessionId,
      state_name: stateName,
      version: StatsReportingService.explorationVersion
    }).toPromise().then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.postStatsToBackend();

    this.playthroughService.recordExplorationQuitAction(
      stateName, StatsReportingService.stateStopwatch.getTimeInSecs());
    this.playthroughService.recordPlaythrough(false);
  }

  recordAnswerSubmitAction(
      stateName:string, destStateName: string,
      interactionId: string, answer: string, feedback: string): void {
    this.playthroughService.recordAnswerSubmitAction(
      stateName, destStateName, interactionId, answer, feedback,
      StatsReportingService.stateStopwatch.getTimeInSecs());
  }
}
angular.module('oppia').factory('StatsReportingService',
  downgradeInjectable(StatsReportingService));
