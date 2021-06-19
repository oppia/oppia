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

  let recordExplorationStartedSpy;
  let recordExplorationActuallyStartedSpy;
  let recordSolutionHitSpy;
  let recordLeaveForRefresherExpSpy;
  let recordStateHitSpy;
  let recordStateCompletedSpy;
  let recordExplorationCompletedSpy;
  let recordAnswerSubmittedSpy;
  let recordMaybeLeaveEventSpy;
  let recordAnswerSubmitActionSpy;

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
    recordExplorationStartedSpy = spyOn(
      statsReportingBackendApiService, 'recordExpStartedAsync')
      .and.returnValue(Promise.resolve({}));
    spyOn(statsReportingBackendApiService, 'postsStatsAsync')
      .and.returnValue(Promise.resolve({}));
    recordExplorationActuallyStartedSpy = spyOn(
      statsReportingBackendApiService, 'recordExplorationActuallyStartedAsync')
      .and.returnValue(Promise.resolve({}));
    recordSolutionHitSpy = spyOn(
      statsReportingBackendApiService, 'recordSolutionHitAsync')
      .and.returnValue(Promise.resolve({}));
    recordLeaveForRefresherExpSpy = spyOn(
      statsReportingBackendApiService, 'recordLeaveForRefresherExpAsync')
      .and.returnValue(Promise.resolve({}));
    recordStateHitSpy = spyOn(
      statsReportingBackendApiService, 'recordStateHitAsync')
      .and.returnValue(Promise.resolve({}));
    recordStateCompletedSpy = spyOn(
      statsReportingBackendApiService, 'recordStateCompletedAsync')
      .and.returnValue(Promise.resolve({}));
    recordExplorationCompletedSpy = spyOn(
      statsReportingBackendApiService, 'recordExplorationCompletedAsync')
      .and.returnValue(Promise.resolve({}));
    recordAnswerSubmittedSpy = spyOn(
      statsReportingBackendApiService, 'recordAnswerSubmittedAsync')
      .and.returnValue(Promise.resolve({}));
    recordMaybeLeaveEventSpy = spyOn(
      statsReportingBackendApiService, 'recordMaybeLeaveEventAsync')
      .and.returnValue(Promise.resolve({}));
    recordAnswerSubmitActionSpy = spyOn(
      playthroughService, 'recordAnswerSubmitAction')
      .and.returnValue(null);
    spyOn(messengerService, 'sendMessage').and.returnValue(null);
    spyOn(siteAnalyticsService, 'registerNewCard').and.returnValue(null);
    spyOn(siteAnalyticsService, 'registerStartExploration')
      .and.returnValue(null);
    spyOn(siteAnalyticsService, 'registerFinishExploration')
      .and.returnValue(null);
    spyOn(siteAnalyticsService, 'registerCuratedLessonCompleted')
      .and.returnValue(null);
    spyOn(playthroughService, 'recordExplorationStartAction')
      .and.returnValue(null);
    spyOn(playthroughService, 'recordExplorationQuitAction')
      .and.returnValue(null);
    spyOn(playthroughService, 'storePlaythrough')
      .and.returnValue(null);
    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(true);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(urlService, 'getUrlParams')
      .and.returnValue({classroom_url_fragment: 'classroom'});
    StatsReportingService.stateStopwatch = Stopwatch.create();
  });

  it('should create default aggregated stats when initialized', () => {
    let defaultValues: AggregatedStats = {
      num_starts: 0,
      num_completions: 0,
      num_actual_starts: 0,
      state_stats_mapping: {}
    };

    expect(StatsReportingService.aggregatedStats).toEqual(defaultValues);
  });

  it('should set session properties when calling ' +
    '\'initSession\'', fakeAsync(() => {
    statsReportingService.initSession(
      explorationId, explorationTitle, explorationVersion,
      sessionId, collectionId);
    tick(300001);
    discardPeriodicTasks();

    expect(StatsReportingService.explorationId).toEqual(explorationId);
    expect(StatsReportingService.explorationTitle).toEqual(explorationTitle);
    expect(StatsReportingService.explorationVersion)
      .toEqual(explorationVersion);
    expect(StatsReportingService.sessionId).toEqual(sessionId);
    expect(StatsReportingService.optionalCollectionId).toEqual(collectionId);
  }));

  it('should record exploration\'s stats when it is about to start', () => {
    StatsReportingService.explorationStarted = false;
    statsReportingService.recordExplorationStarted('firstState', {});

    expect(StatsReportingService.explorationStarted).toBe(true);
    expect(recordExplorationStartedSpy).toHaveBeenCalled();
  });

  it('should not again record exploration\'s stats when ' +
    'it is about to start and already recorded', () => {
    StatsReportingService.explorationStarted = true;
    statsReportingService.recordExplorationStarted('firstState', {});

    expect(recordExplorationStartedSpy).not.toHaveBeenCalled();
  });

  it('should not create default stats for a state if ' +
    'it\'s already exist', () => {
    let defaultStats = {
      total_answers_count: 0,
      useful_feedback_count: 0,
      total_hit_count: 0,
      first_hit_count: 0,
      num_times_solution_viewed: 0,
      num_completions: 0
    };

    let originalStats = {
      total_answers_count: 1,
      useful_feedback_count: 1,
      total_hit_count: 1,
      first_hit_count: 1,
      num_times_solution_viewed: 1,
      num_completions: 1
    };

    StatsReportingService.aggregatedStats.state_stats_mapping = {
      firstState: originalStats
    };

    // Trying to start a state which has already been recorded.
    statsReportingService.recordExplorationStarted('firstState', {});

    expect(StatsReportingService.aggregatedStats.state_stats_mapping.firstState)
      .toBe(originalStats);
    expect(StatsReportingService.aggregatedStats.state_stats_mapping.firstState)
      .not.toBe(defaultStats);
  });

  it('should record exploration\'s stats when it is actually started', () => {
    StatsReportingService.explorationActuallyStarted = false;
    statsReportingService.recordExplorationActuallyStarted('firstState');

    expect(StatsReportingService.currentStateName).toBe('firstState');
    expect(StatsReportingService.explorationActuallyStarted).toBe(true);
    expect(recordExplorationActuallyStartedSpy).toHaveBeenCalled();
  });

  it('should not again record exploration\'s stats when ' +
    'it is actually started and already recorded', () => {
    StatsReportingService.explorationActuallyStarted = true;
    statsReportingService.recordExplorationActuallyStarted('firstState');

    expect(recordExplorationActuallyStartedSpy).not.toHaveBeenCalled();
  });

  it('should record stats status of solution', () => {
    statsReportingService.recordSolutionHit('firstState');

    expect(recordSolutionHitSpy).toHaveBeenCalled();
  });

  it('should record stats when refresher exploration is opened', () => {
    StatsReportingService.nextExpId = null;
    statsReportingService.recordLeaveForRefresherExp(
      'firstState', 'refresherExp');

    expect(StatsReportingService.nextExpId).toBe('refresherExp');
    expect(recordLeaveForRefresherExpSpy).toHaveBeenCalled();
  });

  it('should record stats when state is changed', () => {
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
    expect(StatsReportingService.statesVisited.size).toBe(4);
  });

  it('should record stats when a card in exploration is finished', () => {
    StatsReportingService.currentStateName = null;
    statsReportingService.recordStateCompleted('firstState');

    expect(recordStateCompletedSpy).toHaveBeenCalled();
    expect(StatsReportingService.currentStateName).toBe('firstState');
  });

  it('should record stats when an exploration is finished', () => {
    StatsReportingService.explorationIsComplete = false;
    statsReportingService.recordExplorationCompleted('firstState', {});

    expect(recordExplorationCompletedSpy).toHaveBeenCalled();
    expect(StatsReportingService.explorationIsComplete).toBe(true);
  });

  it('should record stats when a leave event is triggered', () => {
    statsReportingService.recordMaybeLeaveEvent('firstState', {});

    expect(recordMaybeLeaveEventSpy).toHaveBeenCalled();
  });

  it('should record stats when an answer submit button is clicked', () => {
    statsReportingService.recordAnswerSubmitAction(
      'oldState', 'newState', 'expId', 'answer', 'feedback');

    expect(recordAnswerSubmitActionSpy).toHaveBeenCalled();
  });

  it('should record stats when an answer is actually submitted', () => {
    statsReportingService.recordAnswerSubmitted(
      'firstState', {}, 'answer', 0, 0, 'category', true);

    expect(recordAnswerSubmittedSpy).toHaveBeenCalled();
  });

  it('should set topic name', () => {
    StatsReportingService.topicName = null;
    statsReportingService.setTopicName('newTopic');

    expect(StatsReportingService.topicName).toBe('newTopic');
  });
});
