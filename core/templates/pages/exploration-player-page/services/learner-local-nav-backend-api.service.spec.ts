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
 * @fileoverview Unit tests for LearnerViewInfoBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { LearnerLocalNavBackendApiService } from './learner-local-nav-backend-api.service';

describe('Learner Local Nav Backend Api Service', () => {
  let llnba: LearnerLocalNavBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler = jasmine.createSpy('success');
  let failHandler = jasmine.createSpy('fail');
  let expId: string = 'test_id';
  let reportType: boolean = true;
  let reportText: string = 'test report';
  let state: string = 'test state';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LearnerLocalNavBackendApiService]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    llnba = TestBed.inject(LearnerLocalNavBackendApiService);
  });
  afterEach(() => {
    httpTestingController.verify();
  });

  it('should post report', fakeAsync(() => {
    llnba.postReportAsync(
      expId, {
        report_type: reportType,
        report_text: reportText,
        state}).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(llnba.flagExplorationUrl);
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));
});
