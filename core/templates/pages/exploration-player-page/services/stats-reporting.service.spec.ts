// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for stats reporting service.
 */

import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AggregatedStats, StatsReportingBackendApiService } from 'domain/exploration/stats-reporting-backend-api.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { MessengerService } from 'services/messenger.service';
import { PlaythroughService } from 'services/playthrough.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { StatsReportingService } from './stats-reporting.service';
import { Stopwatch } from 'domain/utilities/stopwatch.model';


describe('Stats reporting service ', () => {
  let contextService: ContextService;
  let messengerService: MessengerService;
  let playthroughService: PlaythroughService;
  let siteAnalyticsService: SiteAnalyticsService;
  let statsReportingBackendApiService: StatsReportingBackendApiService;
  let statsReportingService: StatsReportingService;
  let urlService: UrlService;

  let explorationId = 'expId';
  let explorationTitle = 'expTitle';
  let explorationVersion = 2;
  let sessionId = 'sessionId';
  let collectionId = 'collectionID';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    contextService = TestBed.inject(ContextService);
    statsReportingService = TestBed.inject(StatsReportingService);
    statsReportingBackendApiService = TestBed.inject(
      StatsReportingBackendApiService);
    messengerService = TestBed.inject(MessengerService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    playthroughService = TestBed.inject(PlaythroughService);
    urlService = TestBed.inject(UrlService);
  });

  beforeEach(() => {
    spyOn(messengerService, 'sendMessage').and.callThrough();
    spyOn(siteAnalyticsService, 'registerNewCard').and.callThrough();
    spyOn(siteAnalyticsService, 'registerStartExploration')
      .and.callThrough();
    spyOn(siteAnalyticsService, 'registerFinishExploration')
      .and.callThrough();
    spyOn(siteAnalyticsService, 'registerCuratedLessonCompleted')
      .and.callThrough();
    spyOn(playthroughService, 'recordExplorationStartAction')
      .and.callThrough();
    spyOn(playthroughService, 'recordExplorationQuitAction')
      .and.callThrough();
    spyOn(playthroughService, 'storePlaythrough')
      .and.callThrough();
    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(true);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(urlService, 'getUrlParams')
      .and.returnValue({classroom_url_fragment: 'classroom'});
    statsReportingService.stateStopwatch = Stopwatch.create();
  });

  it('should create default aggregated stats when initialized', () => {
    let defaultValues: AggregatedStats = {
      num_starts: 0,
      num_completions: 0,
      num_actual_starts: 0,
      state_stats_mapping: {}
    };

    expect(statsReportingService.aggregatedStats).toEqual(defaultValues);
  });

  it('should set session properties when calling ' +
    '\'initSession\'', fakeAsync(() => {
    // Prechecks.
    expect(statsReportingService.explorationId).toBeUndefined();
    expect(statsReportingService.explorationTitle).toBeUndefined();
    expect(statsReportingService.explorationVersion)
      .toBeUndefined();
    expect(statsReportingService.sessionId).toBeUndefined();
    expect(statsReportingService.optionalCollectionId).toBeUndefined();
    statsReportingService.initSession(
      explorationId, explorationTitle, explorationVersion,
      sessionId, collectionId);
    tick(300001);
    discardPeriodicTasks();

    expect(statsReportingService.explorationId).toEqual(explorationId);
    expect(statsReportingService.explorationTitle).toEqual(explorationTitle);
    expect(statsReportingService.explorationVersion)
      .toEqual(explorationVersion);
    expect(statsReportingService.sessionId).toEqual(sessionId);
    expect(statsReportingService.optionalCollectionId).toEqual(collectionId);
  }));

  it('should record exploration\'s stats when it is about to start', () => {
    let recordExplorationStartedSpy = spyOn(
      statsReportingBackendApiService, 'recordExpStartedAsync')
      .and.returnValue(Promise.resolve({}));
    spyOn(statsReportingBackendApiService, 'recordStateHitAsync')
      .and.returnValue(Promise.resolve({}));
    spyOn(statsReportingBackendApiService, 'postsStatsAsync')
      .and.returnValue(Promise.resolve({}));

    let sampleStats = {
      total_answers_count: 1,
      useful_feedback_count: 1,
      total_hit_count: 1,
      first_hit_count: 1,
      num_times_solution_viewed: 1,
      num_completions: 1
    };
    statsReportingService.aggregatedStats.state_stats_mapping.firstState = (
      sampleStats);

    expect(statsReportingService.explorationStarted).toBe(false);

    statsReportingService.recordExplorationStarted('firstState', {});

    expect(statsReportingService.explorationStarted).toBe(true);
    expect(recordExplorationStartedSpy).toHaveBeenCalled();
    expect(statsReportingBackendApiService.postsStatsAsync).toHaveBeenCalled();
  });

  it('should not again record exploration\'s stats when ' +
    'it is about to start and already recorded', () => {
    let recordExplorationStartedSpy = spyOn(
      statsReportingBackendApiService, 'recordExpStartedAsync')
      .and.returnValue(Promise.resolve({}));
    statsReportingService.explorationStarted = true;

    statsReportingService.recordExplorationStarted('firstState', {});

    expect(recordExplorationStartedSpy).not.toHaveBeenCalled();
  });

  it('should not send request to backend when an exploration ' +
    'it is about to start and already recorded', () => {
    let postStatsSpy = spyOn(statsReportingBackendApiService, 'postsStatsAsync')
      .and.returnValue(Promise.resolve({}));
    spyOn(statsReportingBackendApiService, 'recordExpStartedAsync')
      .and.returnValue(Promise.resolve({}));
    spyOn(statsReportingBackendApiService, 'recordStateHitAsync')
      .and.returnValue(Promise.resolve({}));
    statsReportingService.explorationIsComplete = true;

    statsReportingService.recordExplorationStarted('firstState', {});

    expect(postStatsSpy).not.toHaveBeenCalled();
    expect(statsReportingBackendApiService.recordExpStartedAsync)
      .toHaveBeenCalled();
    expect(statsReportingBackendApiService.recordStateHitAsync)
      .toHaveBeenCalled();
  });

  it('should record exploration\'s stats when it is actually started', () => {
    let recordExplorationActuallyStartedSpy = spyOn(
      statsReportingBackendApiService, 'recordExplorationActuallyStartedAsync')
      .and.returnValue(Promise.resolve({}));
    expect(statsReportingService.currentStateName).toBeUndefined();
    expect(statsReportingService.explorationActuallyStarted).toBe(false);

    statsReportingService.recordExplorationActuallyStarted('firstState');

    expect(statsReportingService.currentStateName).toBe('firstState');
    expect(statsReportingService.explorationActuallyStarted).toBe(true);
    expect(recordExplorationActuallyStartedSpy).toHaveBeenCalled();
  });

  it('should not again record exploration\'s stats when ' +
    'it is actually started and already recorded', () => {
    let recordExplorationActuallyStartedSpy = spyOn(
      statsReportingBackendApiService, 'recordExplorationActuallyStartedAsync')
      .and.returnValue(Promise.resolve({}));
    statsReportingService.explorationActuallyStarted = true;
    statsReportingService.recordExplorationActuallyStarted('firstState');

    expect(recordExplorationActuallyStartedSpy).not.toHaveBeenCalled();
  });

  it('should record stats status of solution', () => {
    let recordSolutionHitSpy = spyOn(
      statsReportingBackendApiService, 'recordSolutionHitAsync')
      .and.returnValue(Promise.resolve({}));
    statsReportingService.recordSolutionHit('firstState');

    expect(recordSolutionHitSpy).toHaveBeenCalled();
  });

  it('should record stats when refresher exploration is opened', () => {
    let recordLeaveForRefresherExpSpy = spyOn(
      statsReportingBackendApiService, 'recordLeaveForRefresherExpAsync')
      .and.returnValue(Promise.resolve({}));
    expect(statsReportingService.nextExpId).toBeUndefined();
    statsReportingService.recordLeaveForRefresherExp(
      'firstState', 'refresherExp');

    expect(statsReportingService.nextExpId).toBe('refresherExp');
    expect(recordLeaveForRefresherExpSpy).toHaveBeenCalled();
  });

  it('should record stats when state is changed', () => {
    let recordStateHitSpy = spyOn(
      statsReportingBackendApiService, 'recordStateHitAsync')
      .and.returnValue(Promise.resolve({}));
    expect(statsReportingService.statesVisited.size).toBe(0);
    // First transition.
    statsReportingService.recordStateTransition(
      'firstState', 'secondState', 'answer', {}, true);

    // Second transition.
    statsReportingService.recordStateTransition(
      'secondState', 'thirdState', 'answer', {}, true);

    // Third transition.
    statsReportingService.recordStateTransition(
      'thirdState', 'fourthState', 'answer', {}, true);

    expect(recordStateHitSpy).toHaveBeenCalled();
    expect(statsReportingService.statesVisited.size).toBe(3);
  });

  it('should record stats when a card in exploration is finished', () => {
    let recordStateCompletedSpy = spyOn(
      statsReportingBackendApiService, 'recordStateCompletedAsync')
      .and.returnValue(Promise.resolve({}));
    expect(statsReportingService.currentStateName).toBeUndefined();
    statsReportingService.recordStateCompleted('firstState');

    expect(recordStateCompletedSpy).toHaveBeenCalled();
    expect(statsReportingService.currentStateName).toBe('firstState');
  });

  it('should record stats when an exploration is finished', () => {
    let recordExplorationCompletedSpy = spyOn(
      statsReportingBackendApiService, 'recordExplorationCompletedAsync')
      .and.returnValue(Promise.resolve({}));
    spyOn(statsReportingBackendApiService, 'postsStatsAsync')
      .and.returnValue(Promise.resolve({}));
    expect(statsReportingService.explorationIsComplete).toBe(false);

    statsReportingService.recordExplorationCompleted('firstState', {});

    expect(recordExplorationCompletedSpy).toHaveBeenCalled();
    expect(statsReportingService.explorationIsComplete).toBe(true);
    expect(statsReportingBackendApiService.postsStatsAsync).toHaveBeenCalled();
  });

  it('should record stats when a leave event is triggered', () => {
    let recordMaybeLeaveEventSpy = spyOn(
      statsReportingBackendApiService, 'recordMaybeLeaveEventAsync')
      .and.returnValue(Promise.resolve({}));
    spyOn(statsReportingBackendApiService, 'postsStatsAsync')
      .and.returnValue(Promise.resolve({}));

    statsReportingService.recordMaybeLeaveEvent('firstState', {});

    expect(recordMaybeLeaveEventSpy).toHaveBeenCalled();
    expect(statsReportingBackendApiService.postsStatsAsync).toHaveBeenCalled();
  });

  it('should record stats when an answer submit button is clicked', () => {
    let recordAnswerSubmitActionSpy = spyOn(
      playthroughService, 'recordAnswerSubmitAction')
      .and.callThrough();
    statsReportingService.recordAnswerSubmitAction(
      'oldState', 'newState', 'expId', 'answer', 'feedback');

    expect(recordAnswerSubmitActionSpy).toHaveBeenCalled();
  });

  it('should record stats when an answer is actually submitted', () => {
    let recordAnswerSubmittedSpy = spyOn(
      statsReportingBackendApiService, 'recordAnswerSubmittedAsync')
      .and.returnValue(Promise.resolve({}));
    statsReportingService.recordAnswerSubmitted(
      'firstState', {}, 'answer', 0, 0, 'category', true);

    expect(recordAnswerSubmittedSpy).toHaveBeenCalled();
  });

  it('should set topic name', () => {
    expect(statsReportingService.topicName).toBeUndefined();
    statsReportingService.setTopicName('newTopic');

    expect(statsReportingService.topicName).toBe('newTopic');
  });
});
