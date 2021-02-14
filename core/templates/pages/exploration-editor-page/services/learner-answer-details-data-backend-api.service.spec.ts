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
import { LearnerAnswerInfo } from 'domain/statistics/learner-answer-info.model';

import { LearnerAnswerDetailsDataService } from
  'pages/exploration-editor-page/services/learner-answer-details-data.service';
import { CsrfTokenService } from
  'services/csrf-token.service';
import { ExplorationDataService } from './exploration-data.service';


fdescribe('Learner answer details service', () => {
  let expId: string = '12345';
  let learnerAnswerDetailsDataService: LearnerAnswerDetailsDataService;
  let sampleDataResults = null;
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
    learnerAnswerDetailsDataService = TestBed.inject(
      LearnerAnswerDetailsDataService);
    csrfService = TestBed.inject(CsrfTokenService);
    httpTestingController = TestBed.inject(HttpTestingController);

    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('when fetchLearnerAnswerInfoData is called', () => {
    beforeEach(() => {
      sampleDataResults = {
        learner_answer_info_data: [{
          state_name: 'fakeStateName',
          interaction_id: 'fakeInteractionId',
          customization_args: 'fakeCustomizationArgs',
          learner_answer_info_dicts: []
        }]
      };
    });

    it('should successfully fetch learner answer info data from the backend',
      fakeAsync(() => {
        sampleDataResults.learner_answer_info_data[0]
          .learner_answer_info_dicts = [{
            id: '123',
            answer: 'My answer',
            answer_details: 'My answer details',
            created_on: 123456
          }];

        let successHandler = jasmine.createSpy('success');
        let failHandler = jasmine.createSpy('fail');
        let createFromBackendDictSpy = spyOn(
          LearnerAnswerInfo, 'createFromBackendDict');
        let requestUrl = '/learneranswerinfohandler/' +
          'learner_answer_details/exploration/12345';
        learnerAnswerDetailsDataService.fetchLearnerAnswerInfoData().then(
          successHandler, failHandler);
        const req = httpTestingController.expectOne(requestUrl);
        expect(req.request.method).toEqual('GET');
        req.flush(sampleDataResults);
        flushMicrotasks();
        expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
        expect(failHandler).not.toHaveBeenCalled();


        expect(createFromBackendDictSpy).toHaveBeenCalledTimes(
          sampleDataResults.learner_answer_info_data[0]
            .learner_answer_info_dicts.length);
        expect(learnerAnswerDetailsDataService.getData().length)
          .toBe(sampleDataResults.learner_answer_info_data.length);
      }));

    it('should not create info dicts if it is not in learner answer info',
      fakeAsync(() => {
        let successHandler = jasmine.createSpy('success');
        let failHandler = jasmine.createSpy('fail');

        let createFromBackendDictSpy = spyOn(
          LearnerAnswerInfo, 'createFromBackendDict');

        let requestUrl = '/learneranswerinfohandler/' +
          'learner_answer_details/exploration/12345';
        learnerAnswerDetailsDataService.fetchLearnerAnswerInfoData().then(
          successHandler, failHandler);
        const req = httpTestingController.expectOne(requestUrl);
        expect(req.request.method).toEqual('GET');
        req.flush(sampleDataResults);

        flushMicrotasks();

        expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
        expect(failHandler).not.toHaveBeenCalled();


        expect(createFromBackendDictSpy).not.toHaveBeenCalled();
        expect(learnerAnswerDetailsDataService.getData().length)
          .toBe(sampleDataResults.learner_answer_info_data.length);
      }));
  });

  it('should delete learner answer info when correct id is provided',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let requestUrl = '/learneranswerinfohandler/' +
        'learner_answer_details/exploration/12345?state_name=fakeStateName&' +
        'learner_answer_info_id=fakeId';
      learnerAnswerDetailsDataService.deleteLearnerAnswerInfo(
        '12345', 'fakeStateName', 'fakeId').then(
        successHandler, failHandler);
      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('DELETE');
      req.flush(200);
      flushMicrotasks();
      expect(successHandler).toHaveBeenCalledWith(200);
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it('should not delete learner answer info when incorrect id is provided',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let requestUrl = '/learneranswerinfohandler/' +
        'learner_answer_details/exploration/12345?state_name=fakeStateName&' +
        'learner_answer_info_id=fakeId';
      learnerAnswerDetailsDataService.deleteLearnerAnswerInfo(
        '12345', 'fakeStateName', 'fakeId').then(
        successHandler, failHandler);
      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('DELETE');
      req.flush(null, {
        status: 404, statusText: 'Error deleting learner answer'
      });
      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(undefined);
    }
    ));
});
