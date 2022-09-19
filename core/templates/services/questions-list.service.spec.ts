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
import { Subscription } from 'rxjs';

import { QuestionsListService } from 'services/questions-list.service';

describe('Questions List Service', () => {
  let qls: QuestionsListService;
  let httpTestingController: HttpTestingController;
  let quesionSummariesInitializedSpy: jasmine.Spy;
  let testSubscriptions: Subscription;
  let sampleResponse = {
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
    more: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    qls = TestBed.get(QuestionsListService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

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

  it('should handle page number changes', fakeAsync(() => {
    expect(qls.getCurrentPageNumber()).toBe(0);
    qls.incrementPageNumber();
    expect(qls.getCurrentPageNumber()).toBe(1);
    qls.incrementPageNumber();
    expect(qls.getCurrentPageNumber()).toBe(2);
    qls.decrementPageNumber();
    expect(qls.getCurrentPageNumber()).toBe(1);
    qls.resetPageNumber();
    expect(qls.getCurrentPageNumber()).toBe(0);
  }));

  it('should not get question summaries when no skill id is provided',
    fakeAsync(() => {
      httpTestingController.expectNone('/questions_list_handler/?offset=');
      qls.getQuestionSummariesAsync('', false, false);
      flushMicrotasks();
    })
  );

  it('should get question summaries twice with history reset',
    fakeAsync(() => {
      qls.getQuestionSummariesAsync('1', true, true);
      let req = httpTestingController.expectOne(
        '/questions_list_handler/1?offset=0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResponse);
      flushMicrotasks();

      expect(qls.getCurrentPageNumber()).toBe(0);
      expect(qls.isLastQuestionBatch()).toBe(true);

      qls.getQuestionSummariesAsync('1', true, true);
      req = httpTestingController.expectOne(
        '/questions_list_handler/1?offset=0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResponse);
      flushMicrotasks();

      expect(quesionSummariesInitializedSpy).toHaveBeenCalledTimes(2);
    })
  );

  it('should not get question summaries twice when page number doesn\'t' +
    ' increase', fakeAsync(() => {
    qls.getQuestionSummariesAsync('1', true, false);
    let req = httpTestingController.expectOne(
      '/questions_list_handler/1?offset=0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleResponse);
    flushMicrotasks();

    expect(qls.getCurrentPageNumber()).toBe(0);
    expect(qls.isLastQuestionBatch()).toBe(true);

    // Try to get questions again before incresing pagenumber.
    qls.getQuestionSummariesAsync('1', true, true);
    req = httpTestingController.expectOne(
      '/questions_list_handler/1?offset=0');
    flushMicrotasks();
    httpTestingController.verify();

    // Increase page number.
    qls.incrementPageNumber();
    expect(qls.getCurrentPageNumber()).toBe(1);
    expect(qls.isLastQuestionBatch()).toBe(false);

    qls.getQuestionSummariesAsync('1', true, false);
    req = httpTestingController.expectOne(
      '/questions_list_handler/1?offset=0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleResponse);
    flushMicrotasks();

    expect(quesionSummariesInitializedSpy).toHaveBeenCalledTimes(2);
  }));

  it('should get cached question summaries', fakeAsync(() => {
    qls.getQuestionSummariesAsync('1', true, true);
    const req = httpTestingController.expectOne(
      '/questions_list_handler/1?offset=0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleResponse);
    flushMicrotasks();

    expect(qls.getCurrentPageNumber()).toBe(0);
    expect(qls.isLastQuestionBatch()).toBe(true);
    expect(quesionSummariesInitializedSpy).toHaveBeenCalledTimes(1);

    const cachedQuestionSummaries = qls.getCachedQuestionSummaries();
    expect(cachedQuestionSummaries[0]._questionSummary._questionId).toBe('0');
  }));
});
