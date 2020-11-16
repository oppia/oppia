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
 * @fileoverview Unit tests for job-data.model.
 */

import { Job } from 'domain/admin/job.model';

describe('Job Data Model', () => {
  it('should correctly convert backend dict to JobData object.', () => {
    let backendDict = {
      human_readable_time_started: 'June 04 12:17:36',
      time_started_msec: 1591273056433.883,
      job_type: 'ActivityContributorsSummaryOneOffJob',
      status_code: 'started',
      is_cancelable: true,
      can_be_canceled: true,
      id: 'ActivityContributorsSummaryOneOffJob-1591273056261-695',
      human_readable_time_finished: '',
      time_finished_msec: 1591273056433.884,
      error: null
    };

    let jobDataObject = Job.createFromBackendDict(backendDict);

    expect(jobDataObject.humanReadableTimeStarted).toEqual('June 04 12:17:36');
    expect(jobDataObject.timeStartedMsec).toEqual(1591273056433.883);
    expect(jobDataObject.jobType).toEqual(
      'ActivityContributorsSummaryOneOffJob');
    expect(jobDataObject.statusCode).toEqual('started');
    expect(jobDataObject.isCancelable).toEqual(true);
    expect(jobDataObject.canBeCanceled).toEqual(true);
    expect(jobDataObject.id).toEqual(
      'ActivityContributorsSummaryOneOffJob-1591273056261-695');
    expect(jobDataObject.humanReadableTimeFinished).toEqual('');
    expect(jobDataObject.timeFinishedMsec).toEqual(1591273056433.884);
    expect(jobDataObject.error).toEqual(null);
  });
});
