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
 * @fileoverview Frontend domain object factory for job data.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export interface IJobDataBackendDict {
  'human_readable_time_finished': string;
  'time_finished_msec': number;
  'job_type': string;
  'status_code': string;
  'error': string;
  'can_be_canceled'?: boolean;
  'is_cancelable': boolean;
  'id': string;
  'time_started_msec': number;
  'human_readable_time_started': string;
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
}

@Injectable({
  providedIn: 'root'
})
export class JobDataObjectFactory {
  createFromBackendDict(backendDict: IJobDataBackendDict): Job {
    return new Job(
      backendDict.human_readable_time_finished, backendDict.time_finished_msec,
      backendDict.job_type, backendDict.status_code, backendDict.error,
      backendDict.can_be_canceled, backendDict.is_cancelable, backendDict.id,
      backendDict.time_started_msec, backendDict.human_readable_time_started);
  }
}

angular.module('oppia').factory(
  'JobDataObjectFactory',
  downgradeInjectable(JobDataObjectFactory));
