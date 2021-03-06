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
 * @fileoverview Tests for AdminJobsTabBackendApiService
 *
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AdminPageConstants } from '../admin-page.constants';
import { AdminJobsTabBackendApiService } from './admin-jobs-tab-backend-api.service';

describe('Admin Jobs Tab Backend Api Service', () => {
  let adminJobsTabBackendApiService: AdminJobsTabBackendApiService;
  let urlInterpolationService: UrlInterpolationService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UrlInterpolationService]
    });
  });

  beforeEach(() => {
    adminJobsTabBackendApiService =
    TestBed.inject(AdminJobsTabBackendApiService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should fetch job output',
    fakeAsync(() => {
      let jobId = 'test_id';
      adminJobsTabBackendApiService.getAdminJobOutput(jobId);
      let adminJobOutputUrl = urlInterpolationService.interpolateUrl(
        AdminPageConstants.ADMIN_JOB_OUTPUT_URL_TEMPLATE, {
          jobId: jobId
        });
      let req = httpTestingController.expectOne(adminJobOutputUrl);
      expect(req.request.method).toEqual('GET');
      flushMicrotasks();
    }));

  it('should start new job', fakeAsync(() => {
    let jobType = 'test_job';
    adminJobsTabBackendApiService.startNewJob(jobType);
    let req = httpTestingController
      .expectOne(AdminPageConstants.ADMIN_HANDLER_URL);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      action: 'start_new_job',
      job_type: jobType
    });
    flushMicrotasks();
  }));

  it('should start new computation', fakeAsync(() => {
    let computationType = 'test_computation';
    adminJobsTabBackendApiService.startComputation(computationType);
    let req = httpTestingController
      .expectOne(AdminPageConstants.ADMIN_HANDLER_URL);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      action: 'start_computation',
      computation_type: computationType
    });
    flushMicrotasks();
  }));

  it('should stop new computation', fakeAsync(() => {
    let computationType = 'test_computation';
    adminJobsTabBackendApiService.stopComputation(computationType);
    let req = httpTestingController
      .expectOne(AdminPageConstants.ADMIN_HANDLER_URL);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      action: 'stop_computation',
      computation_type: computationType
    });
    flushMicrotasks();
  }));

  it('should cancel job', fakeAsync(() => {
    let jobId = 'test_id';
    let jobType = 'test_type';
    adminJobsTabBackendApiService.cancelJob(jobId, jobType);
    let req = httpTestingController
      .expectOne(AdminPageConstants.ADMIN_HANDLER_URL);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      action: 'cancel_job',
      job_id: jobId,
      job_type: jobType
    });
    flushMicrotasks();
  }));
});

