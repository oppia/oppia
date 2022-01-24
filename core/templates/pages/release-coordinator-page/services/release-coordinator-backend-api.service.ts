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
 * @fileoverview Service that manages release coordinator's backend api calls.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BeamJobRunResult, BeamJobRunResultBackendDict } from 'domain/jobs/beam-job-run-result.model';
import { BeamJobRun, BeamJobRunBackendDict } from 'domain/jobs/beam-job-run.model';
import { BeamJob, BeamJobBackendDict } from 'domain/jobs/beam-job.model';

interface MemoryCacheProfileResponse {
  'peak_allocation': string;
  'total_allocation': string;
  'total_keys_stored': string;
}

interface BeamJobsResponse {
  'jobs': BeamJobBackendDict[];
}

interface BeamJobRunsResponse {
  'runs': BeamJobRunBackendDict[];
}

@Injectable({
  providedIn: 'root'
})
export class ReleaseCoordinatorBackendApiService {
  constructor(private http: HttpClient) {}

  async getMemoryCacheProfileAsync(): Promise<MemoryCacheProfileResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<MemoryCacheProfileResponse>(
        '/memorycachehandler').toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async flushMemoryCacheAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.delete<void>(
        '/memorycachehandler').toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  getBeamJobs(): Observable<BeamJob[]> {
    return this.http.get<BeamJobsResponse>('/beam_job').pipe(
      map(r => r.jobs.map(BeamJob.createFromBackendDict))
    );
  }

  getBeamJobRuns(): Observable<BeamJobRun[]> {
    return this.http.get<BeamJobRunsResponse>('/beam_job_run').pipe(
      map(r => r.runs.map(BeamJobRun.createFromBackendDict))
    );
  }

  startNewBeamJob(beamJob: BeamJob): Observable<BeamJobRun> {
    return this.http.put<BeamJobRunBackendDict>('/beam_job_run', {
      job_name: beamJob.name
    }).pipe(map(BeamJobRun.createFromBackendDict));
  }

  cancelBeamJobRun(beamJobRun: BeamJobRun): Observable<BeamJobRun> {
    return this.http.delete<BeamJobRunBackendDict>('/beam_job_run', {
      params: { job_id: beamJobRun.jobId }
    }).pipe(map(BeamJobRun.createFromBackendDict));
  }

  getBeamJobRunOutput(beamJobRun: BeamJobRun): Observable<BeamJobRunResult> {
    return this.http.get<BeamJobRunResultBackendDict>('/beam_job_run_result', {
      params: { job_id: beamJobRun.jobId }
    }).pipe(map(BeamJobRunResult.createFromBackendDict));
  }
}

angular.module('oppia').factory(
  'ReleaseCoordinatorBackendApiService',
  downgradeInjectable(ReleaseCoordinatorBackendApiService));
