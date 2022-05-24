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
 * @fileoverview Unit Tests for ExplorationIdValidationService
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ExplorationIdValidationService } from 'domain/exploration/exploration-id-validation.service';
import { ExplorationSummaryBackendDict, ExplorationSummaryDict } from 'domain/summary/exploration-summary-backend-api.service';

describe('Exploration id validation service', () => {
  let explorationIdValidationService:
    ExplorationIdValidationService;
  let httpTestingController: HttpTestingController;
  let validExpResultsWithCustomCategory: ExplorationSummaryBackendDict;
  let validExpResultsWithDefaultCategory: ExplorationSummaryBackendDict;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    explorationIdValidationService =
      TestBed.inject(ExplorationIdValidationService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  beforeEach(() => {
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
  });

  beforeEach(() => {
    validExpResultsWithCustomCategory = {
      summaries: [{
        id: '0',
        num_views: 0,
        human_readable_contributors_summary: {},
        created_on_msec: 1581965806278.269,
        ratings: {
          5: 0,
          4: 0,
          1: 0,
          3: 0,
          2: 0
        },
        last_updated_msec: 1581965806278.183,
        language_code: 'en',
        category: 'Test',
        objective: 'Dummy exploration for testing all interactions',
        activity_type: 'exploration',
        status: 'public',
        thumbnail_bg_color: '#a33f40',
        tags: [],
        thumbnail_icon_url: '/subjects/Lightbulb.svg',
        community_owned: true,
        title: 'Test of all interactions',
        num_total_threads: 0,
        num_open_threads: 0
      } as ExplorationSummaryDict]
    };
    validExpResultsWithDefaultCategory = {
      summaries: [{
        id: '1',
        num_views: 0,
        human_readable_contributors_summary: {},
        created_on_msec: 1581965806278.269,
        ratings: {
          5: 0,
          4: 0,
          1: 0,
          3: 0,
          2: 0
        },
        last_updated_msec: 1581965806278.183,
        language_code: 'en',
        category: 'Algebra',
        objective: 'Dummy exploration for testing all interactions',
        activity_type: 'exploration',
        status: 'public',
        thumbnail_bg_color: '#a33f40',
        tags: [],
        thumbnail_icon_url: '/subjects/Lightbulb.svg',
        community_owned: true,
        title: 'Test of all interactions',
        num_total_threads: 0,
        num_open_threads: 0
      } as ExplorationSummaryDict]
    };
  });

  afterEach(function() {
    httpTestingController.verify();
  });

  it('should correctly validate the invalid exploration ids', fakeAsync(()=> {
    // The service should respond false when the summaries array
    // is empty.
    const explorationIds = ['0'];
    const requestUrl = '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds)) +
      '&' + 'include_private_explorations=false';

    explorationIdValidationService.isExpPublishedAsync('0')
      .then(successHandler, failHandler);
    let req = httpTestingController
      .expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({summaries: []});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(false);
    expect(failHandler).not.toHaveBeenCalled();

    // The service should respond false when the summaries array
    // contains null.
    explorationIdValidationService.isExpPublishedAsync('0')
      .then(successHandler, failHandler);
    req = httpTestingController
      .expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({summaries: [null]});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(false);
    expect(failHandler).not.toHaveBeenCalled();

    // The service should respond false when the summaries array
    // contains more than one element.
    explorationIdValidationService.isExpPublishedAsync('0')
      .then(successHandler, failHandler);
    req = httpTestingController
      .expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({summaries: [
      'exp1',
      'exp2'
    ]});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(false);
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should correctly validate the valid exploration id', fakeAsync(()=> {
    const explorationIds = ['0'];
    const requestUrl = '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds)) +
      '&' + 'include_private_explorations=false';

    explorationIdValidationService.isExpPublishedAsync('0')
      .then(successHandler, failHandler);
    const req = httpTestingController
      .expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(validExpResultsWithCustomCategory);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(true);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should determine correctness feedback state when it is ' +
    'enabled for the exploration', fakeAsync(() => {
    const explorationId = '0';
    const requestUrl = '/explorehandler/init/' + explorationId;

    explorationIdValidationService.isCorrectnessFeedbackEnabled(explorationId)
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({correctness_feedback_enabled: true});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(true);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should determine correctness feedback state when it is ' +
    'disabled for the exploration', fakeAsync(() => {
    const explorationId = '0';
    const requestUrl = '/explorehandler/init/' + explorationId;

    explorationIdValidationService.isCorrectnessFeedbackEnabled(explorationId)
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({correctness_feedback_enabled: false});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(false);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should determine if the exploration category is ' +
    'default for the exploration', fakeAsync(() => {
    const explorationIds = ['0'];
    const requestUrl = '/explorationsummarieshandler/data?' +
        'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds)) +
        '&' + 'include_private_explorations=false';

    explorationIdValidationService.isDefaultCategoryAsync(explorationIds[0])
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(validExpResultsWithDefaultCategory);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(true);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should determine if the exploration category is ' +
    'not default for the exploration', fakeAsync(() => {
    const explorationIds = ['0'];
    const requestUrl = '/explorationsummarieshandler/data?' +
        'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds)) +
        '&' + 'include_private_explorations=false';

    explorationIdValidationService.isDefaultCategoryAsync(explorationIds[0])
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(validExpResultsWithCustomCategory);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(false);
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
