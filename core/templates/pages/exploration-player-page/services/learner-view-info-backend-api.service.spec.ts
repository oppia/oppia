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
 * @fileoverview Unit tests for LearnerViewInfoBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { LearnerViewInfoBackendApiService } from './learner-view-info-backend-api.service';

describe('Learner View Info Backend Api Service', () => {
  let lvibas: LearnerViewInfoBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler = jasmine.createSpy('success');
  let failHandler = jasmine.createSpy('fail');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LearnerViewInfoBackendApiService]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    lvibas = TestBed.get(LearnerViewInfoBackendApiService);
  });
  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch Learner View Info when calling fetchLearnerInfo',
    fakeAsync(() => {
      let stringifiedExpIds = '';
      let includePrivateExplorations = '';
      let jobOutput = {
        summaries: ['response1',
          'response2']
      };
      lvibas.fetchLearnerInfo(
        stringifiedExpIds,
        includePrivateExplorations).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/explorationsummarieshandler/' +
        'data?stringified_exp_ids=&include_private_explorations=');
      expect(req.request.method).toEqual('GET');
      req.flush(jobOutput);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));
});
