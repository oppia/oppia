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
 * @fileoverview Unit tests for QuestionsListService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { QuestionBackendApiService } from
  'domain/question/question-backend-api.service.ts';
import { QuestionSummaryForOneSkillObjectFactory } from
  'domain/question/QuestionSummaryForOneSkillObjectFactory';
import { QuestionSummaryObjectFactory } from
  'domain/question/QuestionSummaryObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';

import { Subscription } from 'rxjs';

require('services/csrf-token.service.ts');

describe('Questions List Service', function() {
  var qls = null;
  var $q, $httpBackend;
  var questionBackendApiService = null;
  var httpTestingController = null;

  var testSubscriptions = null;
  var quesionSummariesInitializedSpy = null;

  var sampleResponse = {
    question_summary_dicts: [{
      skill_descriptions: [],
      summary: {
        creator_id: '1',
        created_on_msec: 0,
        last_updated_msec: 0,
        id: '0',
        question_content: ''
      }
    }],
    next_start_cursor: null
  };
  var CsrfService;
  var broadcastSpy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    questionBackendApiService = TestBed.get(QuestionBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'QuestionSummaryForOneSkillObjectFactory',
      new QuestionSummaryForOneSkillObjectFactory(
        new QuestionSummaryObjectFactory));
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
    $provide.value('QuestionBackendApiService', questionBackendApiService);
  }));
  beforeEach(angular.mock.inject(function($injector, _$q_, $rootScope) {
    qls = $injector.get('QuestionsListService');
    $httpBackend = $injector.get('$httpBackend');
    $q = _$q_;

    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });
  }));

  beforeEach(() => {
    quesionSummariesInitializedSpy = jasmine.createSpy(
      'questionSummariesInitialized');
    testSubscriptions = new Subscription();
    testSubscriptions.add(qls.onQuestionSummariesInitialized.subscribe(
      quesionSummariesInitializedSpy
    ));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
    httpTestingController.verify();
  });

  it('should handle page number changes', function() {
    expect(qls.getCurrentPageNumber()).toBe(0);
    qls.incrementPageNumber();
    expect(qls.getCurrentPageNumber()).toBe(1);
    qls.incrementPageNumber();
    expect(qls.getCurrentPageNumber()).toBe(2);
    qls.decrementPageNumber();
    expect(qls.getCurrentPageNumber()).toBe(1);
    qls.resetPageNumber();
    expect(qls.getCurrentPageNumber()).toBe(0);
  });

  it('should not get question summaries when no skill id is provided',
    function() {
      $httpBackend.expect(
        'GET', '/questions_list_handler/?cursor=').respond(
        sampleResponse);
      var skillIds = [];
      qls.getQuestionSummariesAsync(skillIds, false, false);
      $httpBackend.verifyNoOutstandingRequest();
    });

  it('should get question summaries twice with history reset',
    fakeAsync(() => {
      var skillIds = ['1'];
      qls.getQuestionSummariesAsync(skillIds, true, true);
      let req = httpTestingController.expectOne(
        '/questions_list_handler/1?cursor=');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResponse);

      flushMicrotasks();

      expect(qls.getCurrentPageNumber()).toBe(0);
      expect(qls.isLastQuestionBatch()).toBe(true);

      qls.getQuestionSummariesAsync(skillIds, true, true);
      req = httpTestingController.expectOne(
        '/questions_list_handler/1?cursor=');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResponse);
      flushMicrotasks();

      expect(quesionSummariesInitializedSpy).toHaveBeenCalledTimes(2);
    })
  );

  it('should not get question summaries twice when page number doesn\'t' +
    ' increase', fakeAsync(() => {
    var skillIds = ['1'];
    qls.getQuestionSummariesAsync(skillIds, true, false);
    let req = httpTestingController.expectOne(
      '/questions_list_handler/1?cursor=');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleResponse);

    flushMicrotasks();

    expect(qls.getCurrentPageNumber()).toBe(0);
    expect(qls.isLastQuestionBatch()).toBe(true);

    // Try to get questions again before incresing pagenumber.
    qls.getQuestionSummariesAsync(skillIds, true, true);
    req = httpTestingController.expectOne(
      '/questions_list_handler/1?cursor=');
    flushMicrotasks();
    httpTestingController.verify();

    // Increase page number.
    qls.incrementPageNumber();
    expect(qls.getCurrentPageNumber()).toBe(1);
    expect(qls.isLastQuestionBatch()).toBe(false);

    qls.getQuestionSummariesAsync(skillIds, true, false);
    req = httpTestingController.expectOne(
      '/questions_list_handler/1?cursor=');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleResponse);
    flushMicrotasks();
    expect(quesionSummariesInitializedSpy).toHaveBeenCalledTimes(2);
  }));

  it('should get more than one question summary with history reseted',
    fakeAsync(() => {
      var skillIds = ['1', '2'];
      qls.getQuestionSummariesAsync(skillIds, true, true);
      let req = httpTestingController.expectOne(
        '/questions_list_handler/1%2C2?cursor=');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResponse);
      flushMicrotasks();

      expect(qls.getCurrentPageNumber()).toBe(0);
      expect(qls.isLastQuestionBatch()).toBe(true);
      expect(quesionSummariesInitializedSpy).toHaveBeenCalled();

      qls.getQuestionSummariesAsync(skillIds, true, true);
      req = httpTestingController.expectOne(
        '/questions_list_handler/1%2C2?cursor=');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResponse);
      flushMicrotasks();
    })
  );

  it('should get cached question summaries', fakeAsync(() => {
    var skillIds = ['1'];
    qls.getQuestionSummariesAsync(skillIds, true, true);
    let req = httpTestingController.expectOne(
      '/questions_list_handler/1?cursor=');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleResponse);
    flushMicrotasks();

    expect(qls.getCurrentPageNumber()).toBe(0);
    expect(qls.isLastQuestionBatch()).toBe(true);
    expect(quesionSummariesInitializedSpy).toHaveBeenCalledTimes(1);

    var cachedQuestionSummaries = qls.getCachedQuestionSummaries();
    expect(cachedQuestionSummaries[0]._questionSummary._questionId).toBe('0');
  }));
});
