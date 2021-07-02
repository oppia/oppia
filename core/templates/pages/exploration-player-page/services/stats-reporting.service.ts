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
import { Injectable, NgZone } from '@angular/core';

import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { MessengerService } from 'services/messenger.service';
import { PlaythroughService } from 'services/playthrough.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { AggregatedStats, StatsReportingBackendApiService } from
  'domain/exploration/stats-reporting-backend-api.service';
import { Stopwatch } from 'domain/utilities/stopwatch.model';

@Injectable({
  providedIn: 'root'
})
export class StatsReportingService {
  constructor(
      private contextService: ContextService,
      private messengerService: MessengerService,
      private playthroughService: PlaythroughService,
      private siteAnalyticsService: SiteAnalyticsService,
      private statsReportingBackendApiService: StatsReportingBackendApiService,
      private urlService: UrlService,
      private ngZone: NgZone
  ) {
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
  static topicName: string = null;
  private static editorPreviewMode: boolean = null;
  private static questionPlayerMode: boolean = null;
  private MINIMUM_NUMBER_OF_VISITED_STATES = 3;

  // The following dict will contain all stats data accumulated over the
  // interval time and will be reset when the dict is sent to backend for
  // recording.
  static aggregatedStats: AggregatedStats = null;

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

  private startStatsTimer(): void {
    if (!StatsReportingService.editorPreviewMode &&
      !StatsReportingService.questionPlayerMode) {
      this.ngZone.runOutsideAngular(() => {
        setInterval(() => {
          this.ngZone.run(() => {
            this.postStatsToBackend();
          });
        }, 300000);
      });
    }
  }

  // This method is called whenever a learner tries to leave an exploration,
  // when a learner starts an exploration, when a learner completes an
  // exploration and also every five minutes.
  private postStatsToBackend(): void {
    if (StatsReportingService.explorationIsComplete) {
      return;
    }

    this.statsReportingBackendApiService.postsStatsAsync(
      StatsReportingService.aggregatedStats,
      StatsReportingService.explorationVersion,
      StatsReportingService.explorationId,
      StatsReportingService.currentStateName,
      StatsReportingService.nextExpId,
      StatsReportingService.previousStateName,
      StatsReportingService.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.refreshAggregatedStats();
  }

  setTopicName(newTopicName: string): void {
    StatsReportingService.topicName = newTopicName;
  }

  initSession(
      newExplorationId: string, newExplorationTitle: string,
      newExplorationVersion: number, newSessionId: string,
      collectionId: string): void {
    StatsReportingService.explorationId = newExplorationId;
    StatsReportingService.explorationTitle = newExplorationTitle;
    StatsReportingService.explorationVersion = newExplorationVersion;
    StatsReportingService.sessionId = newSessionId;
    StatsReportingService.stateStopwatch = Stopwatch.create();
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

    this.statsReportingBackendApiService.recordExpStartedAsync(
      params, StatsReportingService.sessionId, stateName,
      StatsReportingService.explorationVersion,
      StatsReportingService.explorationId,
      StatsReportingService.currentStateName,
      StatsReportingService.nextExpId,
      StatsReportingService.previousStateName,
      StatsReportingService.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.statsReportingBackendApiService.recordStateHitAsync(
      0.0, StatsReportingService.explorationVersion, stateName,
      params, StatsReportingService.sessionId,
      StatsReportingService.explorationId,
      StatsReportingService.currentStateName,
      StatsReportingService.nextExpId,
      StatsReportingService.previousStateName,
      StatsReportingService.nextStateName).then(() => {
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
    this.siteAnalyticsService.registerStartExploration(
      StatsReportingService.explorationId);
  }

  recordExplorationActuallyStarted(stateName: string): void {
    if (StatsReportingService.explorationActuallyStarted) {
      return;
    }
    StatsReportingService.aggregatedStats.num_actual_starts += 1;
    StatsReportingService.currentStateName = stateName;

    this.statsReportingBackendApiService.recordExplorationActuallyStartedAsync(
      StatsReportingService.explorationVersion, stateName,
      StatsReportingService.sessionId,
      StatsReportingService.explorationId,
      StatsReportingService.currentStateName,
      StatsReportingService.nextExpId,
      StatsReportingService.previousStateName,
      StatsReportingService.nextStateName).then(() => {
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

    this.statsReportingBackendApiService.recordSolutionHitAsync(
      StatsReportingService.stateStopwatch.getTimeInSecs(),
      StatsReportingService.explorationVersion,
      stateName,
      StatsReportingService.sessionId,
      StatsReportingService.explorationId,
      StatsReportingService.currentStateName,
      StatsReportingService.nextExpId,
      StatsReportingService.previousStateName,
      StatsReportingService.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });
  }

  recordLeaveForRefresherExp(
      stateName: string, refresherExpId: string): void {
    StatsReportingService.currentStateName = stateName;
    StatsReportingService.nextExpId = refresherExpId;

    this.statsReportingBackendApiService.recordLeaveForRefresherExpAsync(
      StatsReportingService.explorationVersion,
      refresherExpId,
      stateName,
      StatsReportingService.sessionId,
      StatsReportingService.stateStopwatch.getTimeInSecs(),
      StatsReportingService.explorationId,
      StatsReportingService.currentStateName,
      StatsReportingService.nextExpId,
      StatsReportingService.previousStateName,
      StatsReportingService.nextStateName).then(() => {
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

    this.statsReportingBackendApiService.recordStateHitAsync(
      StatsReportingService.stateStopwatch.getTimeInSecs(),
      StatsReportingService.explorationVersion,
      newStateName,
      oldParams,
      StatsReportingService.sessionId,
      StatsReportingService.explorationId,
      StatsReportingService.currentStateName,
      StatsReportingService.nextExpId,
      StatsReportingService.previousStateName,
      StatsReportingService.nextStateName).then(() => {
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
    let numberOfStatesVisited = StatsReportingService.statesVisited.size;
    if (numberOfStatesVisited === this.MINIMUM_NUMBER_OF_VISITED_STATES) {
      let urlParams = this.urlService.getUrlParams();
      if (urlParams.hasOwnProperty('classroom_url_fragment')) {
        this.siteAnalyticsService.registerClassroomLessonActiveUse(
          StatsReportingService.topicName, StatsReportingService.explorationId);
      }
      this.siteAnalyticsService.registerLessonActiveUse();
    }

    StatsReportingService.stateStopwatch.reset();
  }

  recordStateCompleted(stateName: string): void {
    this.createDefaultStateStatsMappingIfMissing(stateName);
    StatsReportingService.aggregatedStats.state_stats_mapping[
      stateName].num_completions += 1;

    StatsReportingService.currentStateName = stateName;

    this.statsReportingBackendApiService.recordStateCompletedAsync(
      StatsReportingService.explorationVersion,
      StatsReportingService.sessionId,
      stateName,
      StatsReportingService.stateStopwatch.getTimeInSecs(),
      StatsReportingService.explorationId,
      StatsReportingService.currentStateName,
      StatsReportingService.nextExpId,
      StatsReportingService.previousStateName,
      StatsReportingService.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });
  }

  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordExplorationCompleted(stateName: string, params: Object): void {
    StatsReportingService.aggregatedStats.num_completions += 1;
    StatsReportingService.currentStateName = stateName;

    this.statsReportingBackendApiService.recordExplorationCompletedAsync(
      StatsReportingService.stateStopwatch.getTimeInSecs(),
      StatsReportingService.optionalCollectionId,
      params,
      StatsReportingService.sessionId,
      stateName,
      StatsReportingService.explorationVersion,
      StatsReportingService.explorationId,
      StatsReportingService.currentStateName,
      StatsReportingService.nextExpId,
      StatsReportingService.previousStateName,
      StatsReportingService.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.messengerService.sendMessage(
      this.messengerService.EXPLORATION_COMPLETED, {
        explorationVersion: StatsReportingService.explorationVersion,
        paramValues: params
      });

    this.siteAnalyticsService.registerFinishExploration(
      StatsReportingService.explorationId);
    let urlParams = this.urlService.getUrlParams();
    if (urlParams.hasOwnProperty('classroom_url_fragment')) {
      this.siteAnalyticsService.registerCuratedLessonCompleted(
        StatsReportingService.topicName, StatsReportingService.explorationId);
    }

    this.postStatsToBackend();
    this.playthroughService.recordExplorationQuitAction(
      stateName, StatsReportingService.stateStopwatch.getTimeInSecs());

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

    this.statsReportingBackendApiService.recordAnswerSubmittedAsync(
      answer, params, StatsReportingService.explorationVersion,
      StatsReportingService.sessionId,
      StatsReportingService.stateStopwatch.getTimeInSecs(),
      stateName,
      answerGroupIndex,
      ruleIndex,
      classificationCategorization,
      StatsReportingService.explorationId,
      StatsReportingService.currentStateName,
      StatsReportingService.nextExpId,
      StatsReportingService.previousStateName,
      StatsReportingService.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });
  }

  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordMaybeLeaveEvent(stateName: string, params: Object): void {
    StatsReportingService.currentStateName = stateName;

    this.statsReportingBackendApiService.recordMaybeLeaveEventAsync(
      StatsReportingService.stateStopwatch.getTimeInSecs(),
      StatsReportingService.optionalCollectionId,
      params,
      StatsReportingService.sessionId,
      stateName,
      StatsReportingService.explorationVersion,
      StatsReportingService.explorationId,
      StatsReportingService.currentStateName,
      StatsReportingService.nextExpId,
      StatsReportingService.previousStateName,
      StatsReportingService.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.postStatsToBackend();

    this.playthroughService.recordExplorationQuitAction(
      stateName, StatsReportingService.stateStopwatch.getTimeInSecs());
    this.playthroughService.storePlaythrough();
  }

  recordAnswerSubmitAction(
      stateName: string, destStateName: string,
      interactionId: string, answer: string, feedback: string): void {
    this.playthroughService.recordAnswerSubmitAction(
      stateName, destStateName, interactionId, answer, feedback,
      StatsReportingService.stateStopwatch.getTimeInSecs());
  }
}
angular.module('oppia').factory('StatsReportingService',
  downgradeInjectable(StatsReportingService));
