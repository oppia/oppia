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
 * @fileoverview Unit tests for ReleaseCoordinatorBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { JobsData, JobsDataBackendDict, ReleaseCoordinatorBackendApiService } from './release-coordinator-backend-api.service';
import { ComputationData } from 'domain/admin/computation-data.model';
import { Job } from 'domain/admin/job.model';
import { JobStatusSummary } from 'domain/admin/job-status-summary.model';
import { CsrfTokenService } from 'services/csrf-token.service';

describe('Release coordinator backend api service', () => {
  let rcbas: ReleaseCoordinatorBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService = null;
  let successHandler = null;
  let failHandler = null;
  let jobsDataBackendResponse: JobsDataBackendDict = {
    unfinished_job_data: [],
    one_off_job_status_summaries: [],
    human_readable_current_time: 'June 03 15:31:20',
    audit_job_status_summaries: [],
    recent_job_data: [],
    continuous_computations_data: [
      {
        is_startable: true,
        status_code: 'never_started',
        computation_type: 'FeedbackAnalyticsAggregator',
        last_started_msec: null,
        active_realtime_layer_index: null,
        last_stopped_msec: null,
        is_stoppable: false,
        last_finished_msec: null
      }
    ]
  };
  let jobsData: JobsData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    rcbas = TestBed.get(ReleaseCoordinatorBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    csrfService = TestBed.get(CsrfTokenService);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
    jobsData = {
      oneOffJobStatusSummaries:
       jobsDataBackendResponse.one_off_job_status_summaries.map(
         JobStatusSummary.createFromBackendDict),
      humanReadableCurrentTime:
       jobsDataBackendResponse.human_readable_current_time,
      auditJobStatusSummaries:
       jobsDataBackendResponse.audit_job_status_summaries.map(
         JobStatusSummary.createFromBackendDict),
      unfinishedJobData: jobsDataBackendResponse.unfinished_job_data.map(
        Job.createFromBackendDict),
      recentJobData: jobsDataBackendResponse.recent_job_data.map(
        Job.createFromBackendDict),
      continuousComputationsData:
       jobsDataBackendResponse.continuous_computations_data.map(
         ComputationData.createFromBackendDict)
    };

    spyOn(csrfService, 'getTokenAsync').and.callFake(async() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch the jobs data', fakeAsync(() => {
    rcbas.getJobsDataAsync().then((adminData) => {
      expect(adminData).toEqual(jobsData);
    });

    let req = httpTestingController.expectOne('/jobshandler');
    expect(req.request.method).toEqual('GET');
    req.flush(jobsDataBackendResponse);

    flushMicrotasks();
  }));

  it('should use the rejection handler if the backend request failed.',
    fakeAsync(() => {
      rcbas.getJobsDataAsync().then(successHandler, failHandler);

      var req = httpTestingController.expectOne(
        '/jobshandler');
      expect(req.request.method).toEqual('GET');

      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    })
  );

  it('should request to start a new job when calling startNewJobAsync',
    fakeAsync(() => {
      let jobType = 'ActivityContributorsSummaryOneOffJob';
      let payload = {
        action: 'start_new_job',
        job_type: jobType
      };
      rcbas.startNewJobAsync(jobType).then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/jobshandler');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should request to cancel the job given its id' +
   'and type when calling cancelJobAsync', fakeAsync(() => {
    let jobId = 'AuditContributorsOneOffJob-1608291840709-843';
    let jobType = 'AuditContributorsOneOffJob';
    let payload = {
      action: 'cancel_job',
      job_id: jobId,
      job_type: jobType
    };
    rcbas.cancelJobAsync(jobId, jobType).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/jobshandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should request to start computation given the job' +
   'name when calling startComputationAsync', fakeAsync(() => {
    let computationType = 'FeedbackAnalyticsAggregator';
    let payload = {
      action: 'start_computation',
      computation_type: computationType
    };
    rcbas.startComputationAsync(computationType)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/jobshandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should request to stop computation given the job' +
   'name when calling stopComputationAsync', fakeAsync(() => {
    let computationType = 'FeedbackAnalyticsAggregator';
    let payload = {
      action: 'stop_computation',
      computation_type: computationType
    };
    rcbas.stopComputationAsync(computationType)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/jobshandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to stop computation given the job' +
   'name when calling stopComputationAsync', fakeAsync(() => {
    let computationType = 'InvalidComputaionType';
    let payload = {
      action: 'stop_computation',
      computation_type: computationType
    };
    rcbas.stopComputationAsync(computationType)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/jobshandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      error: 'Some error in the backend.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
  }));

  it('should request to show the output of valid' +
   'jobs when calling showJobOutputAsync', fakeAsync(() => {
    let jobId = 'UserSettingsModelAuditOneOffJob-1609088541992-314';
    let adminJobOutputUrl = '/joboutputhandler?job_id=' +
     'UserSettingsModelAuditOneOffJob-1609088541992-314';
    let jobOutput = {output: ['[u\'fully-validated UserSettingsModel\', 1]']};
    rcbas.fetchJobOutputAsync(jobId).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(adminJobOutputUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(jobOutput);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(jobOutput.output);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should request to show the sorted output of valid' +
   'jobs when calling showJobOutputAsync', fakeAsync(() => {
    let jobId = 'UserSettingsModelAuditOneOffJob-1609088541992-314';
    let adminJobOutputUrl = '/joboutputhandler?job_id=' +
     'UserSettingsModelAuditOneOffJob-1609088541992-314';
    let jobOutput = {output: ['[u\'SUCCESS_KEPT\', 1]',
      '[u\'SUCCESS_DELETED\', 1]']};
    rcbas.fetchJobOutputAsync(jobId).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(adminJobOutputUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(jobOutput);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(jobOutput.output.sort());
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to show the output of invalid' +
   'jobs when calling showJobOutputAsync', fakeAsync(() => {
    let jobId = 'Invalid jobId';
    let adminJobOutputUrl = '/joboutputhandler?job_id=Invalid%20jobId';
    rcbas.fetchJobOutputAsync(jobId).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(adminJobOutputUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Internal Server Error'
    }, {
      status: 500, statusText: 'NoneType object has no attribute output'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Internal Server Error');
  }));

  it('should flush the memory cache when calling' +
   'flushMemoryCacheAsync', fakeAsync(() => {
    rcbas.flushMemoryCacheAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/memorycachehandler');
    expect(req.request.method).toEqual('DELETE');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to flush the memory cache when calling' +
   'flushMemoryCacheAsync', fakeAsync(() => {
    rcbas.flushMemoryCacheAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/memorycachehandler');
    expect(req.request.method).toEqual('DELETE');
    req.flush({
      error: 'Failed to flush memory cache.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to flush memory cache.');
  }));

  it('should get the data of memory cache profile when' +
   'calling getMemoryCacheProfileAsync', fakeAsync(() => {
    rcbas.getMemoryCacheProfileAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/memorycachehandler');
    expect(req.request.method).toEqual('GET');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to get the data of memory cache profile' +
   'when calling getMemoryCacheProfileAsync', fakeAsync(() => {
    rcbas.getMemoryCacheProfileAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/memorycachehandler');
    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Failed to get data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to get data.');
  }));
});
