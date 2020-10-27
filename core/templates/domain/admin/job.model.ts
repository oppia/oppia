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
 * @fileoverview Frontend model for job data.
 */

export interface JobDataBackendDict {
  'human_readable_time_finished': string;
  'time_finished_msec': number;
  'job_type': string;
  'status_code': string;
  'error': string;
  'is_cancelable': boolean;
  'id': string;
  'time_started_msec': number;
  'human_readable_time_started': string;
  // This property is optional because this object factory is used for
  // both 'recent_job_data' and 'unfinished_job_data' in admin page.
  // 'recent_job_data' doesn't have this property.
  'can_be_canceled'?: boolean;
}

export class Job {
  humanReadableTimeFinished: string;
  timeFinishedMsec: number;
  jobType: string;
  statusCode: string;
  error: string;
  canBeCanceled: boolean;
  isCancelable: boolean;
  id: string;
  timeStartedMsec: number;
  humanReadableTimeStarted: string;

  constructor(
      humanReadableTimeFinished: string, timeFinishedMsec: number,
      jobType: string, statusCode: string, error: string,
      canBeCanceled: boolean, isCancelable: boolean, id: string,
      timeStartedMsec: number, humanReadableTimeStarted: string) {
    this.humanReadableTimeFinished = humanReadableTimeFinished;
    this.timeFinishedMsec = timeFinishedMsec;
    this.jobType = jobType;
    this.statusCode = statusCode;
    this.error = error;
    this.canBeCanceled = canBeCanceled;
    this.isCancelable = isCancelable;
    this.id = id;
    this.timeStartedMsec = timeStartedMsec;
    this.humanReadableTimeStarted = humanReadableTimeStarted;
  }

  static createFromBackendDict(backendDict: JobDataBackendDict): Job {
    return new Job(
      backendDict.human_readable_time_finished, backendDict.time_finished_msec,
      backendDict.job_type, backendDict.status_code, backendDict.error,
      backendDict.can_be_canceled, backendDict.is_cancelable, backendDict.id,
      backendDict.time_started_msec, backendDict.human_readable_time_started);
  }
}
