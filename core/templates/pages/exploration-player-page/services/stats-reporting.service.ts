// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
import { ServicesConstants } from 'services/services.constants';

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
    this.editorPreviewMode = (
      this.contextService.isInExplorationEditorPage());
    this.questionPlayerMode = (
      this.contextService.isInQuestionPlayerMode());
    this.refreshAggregatedStats();
  }

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  explorationId!: string;
  explorationTitle!: string;
  explorationVersion!: number;
  sessionId!: string;
  stateStopwatch!: Stopwatch;
  optionalCollectionId!: string;
  currentStateName!: string;
  nextExpId!: string;
  previousStateName!: string;
  nextStateName!: string;
  topicName!: string;
  private editorPreviewMode: boolean = false;
  private questionPlayerMode: boolean = false;
  statesVisited: Set<string> = new Set();
  explorationStarted: boolean = false;
  explorationActuallyStarted: boolean = false;
  explorationIsComplete: boolean = false;
  private MINIMUM_NUMBER_OF_VISITED_STATES = 3;

  // The following dict will contain all stats data accumulated over the
  // interval time and will be reset when the dict is sent to backend for
  // recording.
  aggregatedStats!: AggregatedStats;

  private refreshAggregatedStats(): void {
    this.aggregatedStats = {
      num_starts: 0,
      num_completions: 0,
      num_actual_starts: 0,
      state_stats_mapping: {}
    };
  }

  private createDefaultStateStatsMappingIfMissing(stateName: string): void {
    if (
      this.aggregatedStats.state_stats_mapping.hasOwnProperty(
        stateName)) {
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

  private startStatsTimer(): void {
    if (!this.editorPreviewMode &&
      !this.questionPlayerMode) {
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
    if (this.explorationIsComplete) {
      return;
    }

    this.statsReportingBackendApiService.postsStatsAsync(
      this.aggregatedStats,
      this.explorationVersion,
      this.explorationId,
      this.currentStateName,
      this.nextExpId,
      this.previousStateName,
      this.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.refreshAggregatedStats();
  }

  setTopicName(newTopicName: string): void {
    this.topicName = newTopicName;
  }

  initSession(
      newExplorationId: string, newExplorationTitle: string,
      newExplorationVersion: number, newSessionId: string,
      collectionId: string): void {
    this.explorationId = newExplorationId;
    this.explorationTitle = newExplorationTitle;
    this.explorationVersion = newExplorationVersion;
    this.sessionId = newSessionId;
    this.stateStopwatch = Stopwatch.create();
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
    this.aggregatedStats.state_stats_mapping[
      stateName].total_hit_count += 1;
    this.aggregatedStats.state_stats_mapping[
      stateName].first_hit_count += 1;

    this.postStatsToBackend();

    this.currentStateName = stateName;

    this.statsReportingBackendApiService.recordExpStartedAsync(
      params, this.sessionId, stateName,
      this.explorationVersion,
      this.explorationId,
      this.currentStateName,
      this.nextExpId,
      this.previousStateName,
      this.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.statsReportingBackendApiService.recordStateHitAsync(
      0.0, this.explorationVersion, stateName,
      params, this.sessionId,
      this.explorationId,
      this.currentStateName,
      this.nextExpId,
      this.previousStateName,
      this.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.messengerService.sendMessage(
      ServicesConstants.MESSENGER_PAYLOAD.EXPLORATION_LOADED, {
        explorationVersion: this.explorationVersion,
        explorationTitle: this.explorationTitle
      });

    this.statesVisited.add(stateName);
    this.siteAnalyticsService.registerNewCard(1, this.explorationId);

    this.stateStopwatch.reset();
    this.explorationStarted = true;
    this.siteAnalyticsService.registerStartExploration(
      this.explorationId);
  }

  recordExplorationActuallyStarted(stateName: string): void {
    if (this.explorationActuallyStarted) {
      return;
    }
    this.aggregatedStats.num_actual_starts += 1;
    this.currentStateName = stateName;

    this.statsReportingBackendApiService.recordExplorationActuallyStartedAsync(
      this.explorationVersion, stateName,
      this.sessionId,
      this.explorationId,
      this.currentStateName,
      this.nextExpId,
      this.previousStateName,
      this.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.playthroughService.recordExplorationStartAction(stateName);
    this.explorationActuallyStarted = true;
  }

  recordSolutionHit(stateName: string): void {
    this.createDefaultStateStatsMappingIfMissing(stateName);
    this.aggregatedStats.state_stats_mapping[
      stateName].num_times_solution_viewed += 1;
    this.currentStateName = stateName;

    this.statsReportingBackendApiService.recordSolutionHitAsync(
      this.stateStopwatch.getTimeInSecs(),
      this.explorationVersion,
      stateName,
      this.sessionId,
      this.explorationId,
      this.currentStateName,
      this.nextExpId,
      this.previousStateName,
      this.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });
  }

  recordLeaveForRefresherExp(
      stateName: string, refresherExpId: string): void {
    this.currentStateName = stateName;
    this.nextExpId = refresherExpId;

    this.statsReportingBackendApiService.recordLeaveForRefresherExpAsync(
      this.explorationVersion,
      refresherExpId,
      stateName,
      this.sessionId,
      this.stateStopwatch.getTimeInSecs(),
      this.explorationId,
      this.currentStateName,
      this.nextExpId,
      this.previousStateName,
      this.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });
  }

  // Note that this also resets the stateStopwatch.
  // The type of oldParams is declared as Object since it can vary depending
  // on the oldStateName.
  recordStateTransition(
      oldStateName: string, newStateName: string, answer: string,
      oldParams: Object, isFirstHit: boolean,
      chapterNumber: string, cardCount: string, language: string): void {
    this.createDefaultStateStatsMappingIfMissing(newStateName);
    this.aggregatedStats.state_stats_mapping[
      newStateName].total_hit_count += 1;
    if (isFirstHit) {
      this.aggregatedStats.state_stats_mapping[
        newStateName].first_hit_count += 1;
    }

    this.previousStateName = oldStateName;
    this.nextStateName = newStateName;

    this.statsReportingBackendApiService.recordStateHitAsync(
      this.stateStopwatch.getTimeInSecs(),
      this.explorationVersion,
      newStateName,
      oldParams,
      this.sessionId,
      this.explorationId,
      this.currentStateName,
      this.nextExpId,
      this.previousStateName,
      this.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });

    // Broadcast information about the state transition to listeners.
    this.messengerService.sendMessage(
      ServicesConstants.MESSENGER_PAYLOAD.STATE_TRANSITION, {
        explorationVersion: this.explorationVersion,
        jsonAnswer: JSON.stringify(answer),
        newStateName: newStateName,
        oldStateName: oldStateName,
        paramValues: oldParams
      });

    if (!this.statesVisited.has(newStateName)) {
      this.statesVisited.add(newStateName);
      this.siteAnalyticsService.registerNewCard(
        this.statesVisited.size,
        this.explorationId);
    }
    let numberOfStatesVisited = this.statesVisited.size;
    if (numberOfStatesVisited === this.MINIMUM_NUMBER_OF_VISITED_STATES) {
      let urlParams = this.urlService.getUrlParams();
      this.siteAnalyticsService.registerLessonEngagedWithEvent(
        this.explorationId,
        language
      );
      if (urlParams.hasOwnProperty('classroom_url_fragment')) {
        this.siteAnalyticsService.registerClassroomLessonEngagedWithEvent(
          urlParams.classroom_url_fragment,
          this.topicName,
          this.explorationTitle,
          this.explorationId,
          chapterNumber,
          cardCount,
          language
        );
      } else {
        this.siteAnalyticsService.registerCommunityLessonEngagedWithEvent(
          this.explorationId,
          language
        );
      }
      this.siteAnalyticsService.registerLessonActiveUse();
    }

    this.stateStopwatch.reset();
  }

  recordStateCompleted(stateName: string): void {
    this.createDefaultStateStatsMappingIfMissing(stateName);
    this.aggregatedStats.state_stats_mapping[
      stateName].num_completions += 1;

    this.currentStateName = stateName;

    this.statsReportingBackendApiService.recordStateCompletedAsync(
      this.explorationVersion,
      this.sessionId,
      stateName,
      this.stateStopwatch.getTimeInSecs(),
      this.explorationId,
      this.currentStateName,
      this.nextExpId,
      this.previousStateName,
      this.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });
  }

  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordExplorationCompleted(
      stateName: string,
      params: Object,
      chapterNumber: string,
      cardCount: string,
      language: string
  ): void {
    this.aggregatedStats.num_completions += 1;
    this.currentStateName = stateName;

    this.statsReportingBackendApiService.recordExplorationCompletedAsync(
      this.stateStopwatch.getTimeInSecs(),
      this.optionalCollectionId,
      params,
      this.sessionId,
      stateName,
      this.explorationVersion,
      this.explorationId,
      this.currentStateName,
      this.nextExpId,
      this.previousStateName,
      this.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.messengerService.sendMessage(
      ServicesConstants.MESSENGER_PAYLOAD.EXPLORATION_COMPLETED, {
        explorationVersion: this.explorationVersion,
        paramValues: params
      });

    this.siteAnalyticsService.registerFinishExploration(
      this.explorationId);
    let urlParams = this.urlService.getUrlParams();
    if (urlParams.hasOwnProperty('classroom_url_fragment')) {
      this.siteAnalyticsService.registerCuratedLessonCompleted(
        urlParams.classroom_url_fragment,
        this.topicName,
        this.explorationTitle,
        this.explorationId,
        chapterNumber,
        cardCount,
        language
      );
    } else {
      this.siteAnalyticsService.registerCommunityLessonCompleted(
        this.explorationId
      );
    }

    this.postStatsToBackend();
    this.playthroughService.recordExplorationQuitAction(
      stateName, this.stateStopwatch.getTimeInSecs());

    this.explorationIsComplete = true;
  }

  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordAnswerSubmitted(
      stateName: string, params: Object, answer: string,
      explorationId: string, answerIsCorrect: boolean,
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

    this.statsReportingBackendApiService.recordAnswerSubmittedAsync(
      answer, params, this.explorationVersion,
      this.sessionId,
      this.stateStopwatch.getTimeInSecs(),
      stateName,
      answerGroupIndex,
      ruleIndex,
      classificationCategorization,
      this.explorationId,
      this.currentStateName,
      this.nextExpId,
      this.previousStateName,
      this.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.siteAnalyticsService.registerAnswerSubmitted(
      explorationId, answerIsCorrect);
  }

  // The type of params is declared as Object since it can vary depending
  // on the stateName.
  recordMaybeLeaveEvent(stateName: string, params: Object): void {
    this.currentStateName = stateName;

    this.statsReportingBackendApiService.recordMaybeLeaveEventAsync(
      this.stateStopwatch.getTimeInSecs(),
      this.optionalCollectionId,
      params,
      this.sessionId,
      stateName,
      this.explorationVersion,
      this.explorationId,
      this.currentStateName,
      this.nextExpId,
      this.previousStateName,
      this.nextStateName).then(() => {
      // Required for the post operation to deliver data to backend.
    });

    this.postStatsToBackend();

    this.playthroughService.recordExplorationQuitAction(
      stateName, this.stateStopwatch.getTimeInSecs());
    this.playthroughService.storePlaythrough();
  }

  recordAnswerSubmitAction(
      stateName: string, destStateName: string,
      interactionId: string, answer: string, feedback: string): void {
    this.playthroughService.recordAnswerSubmitAction(
      stateName, destStateName, interactionId, answer, feedback,
      this.stateStopwatch.getTimeInSecs());
  }
}
angular.module('oppia').factory('StatsReportingService',
  downgradeInjectable(StatsReportingService));
