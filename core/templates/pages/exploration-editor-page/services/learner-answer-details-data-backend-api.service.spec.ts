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
 * @fileoverview Unit tests for LearnerAnswerDetailsDataService.
 */
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';

import { LearnerAnswerDetailsDataBackendApiService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/services/learner-answer-details-data-backend-api.service';
import { CsrfTokenService } from
  'services/csrf-token.service';
import { ExplorationDataService } from './exploration-data.service';
import { HttpResponse } from '@angular/common/http';


describe('Learner answer details data backend api service', () => {
  let expId: string = '12345';
  let learnerAnswerDetailsDataBackendApiService
    : LearnerAnswerDetailsDataBackendApiService;
  let sampleHttpResponse;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService = null;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: expId
          }
        }]
    });
    learnerAnswerDetailsDataBackendApiService = TestBed.inject(
      LearnerAnswerDetailsDataBackendApiService);
    csrfService = TestBed.inject(CsrfTokenService);
    httpTestingController = TestBed.inject(HttpTestingController);
    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('when _fetchLearnerAnswerInfoData is called', () => {
    beforeEach(() => {
      sampleHttpResponse = new HttpResponse({
        url: '/learneranswerinfohandler/' +
          'learner_answer_details/exploration/12345',
        body: 'Sample Body'
      });
    });

    it('should successfully fetch learner answer info data from the backend',
      fakeAsync(() => {
        let successHandler = jasmine.createSpy('success');
        let failHandler = jasmine.createSpy('fail');
        let requestUrl = '/learneranswerinfohandler/' +
          'learner_answer_details/exploration/12345';
        learnerAnswerDetailsDataBackendApiService
          ._fetchLearnerAnswerInfoData().then(
            successHandler, failHandler);
        const req = httpTestingController.expectOne(requestUrl);
        expect(req.request.method).toEqual('GET');
        req.flush('Sample Body');
        flushMicrotasks();
        expect(successHandler).toHaveBeenCalledWith(sampleHttpResponse);
        expect(failHandler).not.toHaveBeenCalled();
      }));
  });

  it('should successfully make a http request with delete method',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let requestUrl = '/learneranswerinfohandler/' +
        'learner_answer_details/exploration/12345?state_name=fakeStateName&' +
        'learner_answer_info_id=fakeId';
      learnerAnswerDetailsDataBackendApiService._deleteLearnerAnswerInfo(
        '12345', 'fakeStateName', 'fakeId').then(
        successHandler, failHandler);
      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('DELETE');
      req.flush(200);
      flushMicrotasks();
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));
});
