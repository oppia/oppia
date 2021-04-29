// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for StatsReportingBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ContextService } from 'services/context.service';
import { InterpolationValuesType, UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { StatsReportingBackendApiService } from
  'domain/exploration/stats-reporting-backend-api.service';

describe('Stats reporting backend API Service', () => {
  let contextService: ContextService;
  let httpTestingController: HttpTestingController;
  let statsReportingBackendApiService: StatsReportingBackendApiService;
  let urlInterpolationService: UrlInterpolationService;
  let expVersion = 1;
  let expId = 'expId';
  let currentState = 'currentState';
  let nextExpId = 'nextExpId';
  let previousState = 'previousState';
  let nextState = 'nextState';
  let sessionId = 'sessionId';
  let collectionId = 'collectionId';
  let timeSpent = 14.03;
  let aggregatedStats = {
    num_starts: 1,
    num_completions: 0,
    num_actual_starts: 2,
    state_stats_mapping: {
      currentState: {
        total_answers_count: 2,
        useful_feedback_count: 0,
        total_hit_count: 3,
        first_hit_count: 5,
        num_times_solution_viewed: 6,
        num_completions: 0
      }
    }
  };
  let params = {
    param1: 'value'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    contextService = TestBed.get(ContextService);
    httpTestingController = TestBed.get(HttpTestingController);
    statsReportingBackendApiService = TestBed.get(
      StatsReportingBackendApiService);
    urlInterpolationService = TestBed.get(UrlInterpolationService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should post stats correctly.', fakeAsync(() => {
    statsReportingBackendApiService.postsStatsAsync(
      aggregatedStats, expVersion, expId, currentState, nextExpId,
      previousState, nextState);

    let req = httpTestingController.expectOne(
      '/explorehandler/stats_events/expId');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
  }));

  it('should record exp start correctly.', fakeAsync(() => {
    statsReportingBackendApiService.recordExpStartedAsync(
      params, sessionId, currentState, expVersion, expId, currentState,
      nextExpId, previousState, nextState);

    let req = httpTestingController.expectOne(
      '/explorehandler/exploration_start_event/expId');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
  }));

  it('should record state hit correctly.', fakeAsync(() => {
    statsReportingBackendApiService.recordStateHitAsync(
      timeSpent, expVersion, nextState, params, sessionId, expId, currentState,
      nextExpId, previousState, nextState);

    let req = httpTestingController.expectOne(
      '/explorehandler/state_hit_event/expId');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
  }));

  it('should record exploration actually started correctly.', fakeAsync(() => {
    statsReportingBackendApiService.recordExplorationActuallyStartedAsync(
      expVersion, currentState, sessionId, expId, currentState,
      nextExpId, previousState, nextState);

    let req = httpTestingController.expectOne(
      '/explorehandler/exploration_actual_start_event/expId');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
  }));

  it('should record solution hit correctly.', fakeAsync(() => {
    statsReportingBackendApiService.recordSolutionHitAsync(
      timeSpent, expVersion, currentState, sessionId, expId, currentState,
      nextExpId, previousState, nextState);

    let req = httpTestingController.expectOne(
      '/explorehandler/solution_hit_event/expId');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
  }));

  it('should record leave for refresher exp correctly.', fakeAsync(() => {
    statsReportingBackendApiService.recordLeaveForRefresherExpAsync(
      expVersion, expId, currentState, sessionId, timeSpent, expId,
      currentState, nextExpId, previousState, nextState);

    let req = httpTestingController.expectOne(
      '/explorehandler/leave_for_refresher_exp_event/expId');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
  }));

  it('should record state completion correctly.', fakeAsync(() => {
    statsReportingBackendApiService.recordStateCompletedAsync(
      expVersion, sessionId, currentState, timeSpent, expId,
      currentState, nextExpId, previousState, nextState);

    let req = httpTestingController.expectOne(
      '/explorehandler/state_complete_event/expId');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
  }));

  it('should record exploration completion correctly.', fakeAsync(() => {
    statsReportingBackendApiService.recordExplorationCompletedAsync(
      timeSpent, collectionId, params, sessionId, currentState, expVersion,
      expId, currentState, nextExpId, previousState, nextState);

    let req = httpTestingController.expectOne(
      '/explorehandler/exploration_complete_event/expId');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
  }));

  it('should record answer submission correctly.', fakeAsync(() => {
    statsReportingBackendApiService.recordAnswerSubmittedAsync(
      'answer', params, expVersion, sessionId, timeSpent, previousState,
      1, 2, 'category', expId, currentState, nextExpId, previousState,
      nextState);

    let req = httpTestingController.expectOne(
      '/explorehandler/answer_submitted_event/expId');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
  }));

  it('should record exp leave correctly.', fakeAsync(() => {
    statsReportingBackendApiService.recordMaybeLeaveEventAsync(
      timeSpent, collectionId, params, sessionId, currentState, expVersion,
      expId, currentState, nextExpId, previousState, nextState);

    let req = httpTestingController.expectOne(
      '/explorehandler/exploration_maybe_leave_event/expId');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
  }));

  it('should handle errors correctly.', fakeAsync(async() => {
    let mockGetExpId = () => {
      return 'expId';
    };

    let mockInterpolateUrl = (
        urlTemplate: string,
        interpolationValues: InterpolationValuesType) => {
      throw new Error('Error');
    };

    spyOn(urlInterpolationService, 'interpolateUrl').and.callFake(
      mockInterpolateUrl);

    spyOn(contextService, 'getExplorationId').and.callFake(mockGetExpId);

    flushMicrotasks();
    await expectAsync(statsReportingBackendApiService.postsStatsAsync(
      aggregatedStats, expVersion, expId, currentState, nextExpId,
      previousState, nextState)).toBeRejectedWithError();
  }));
});
