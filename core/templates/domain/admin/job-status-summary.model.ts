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
 * @fileoverview Frontend model for job specs.
 */

export interface JobStatusSummaryBackendDict {
  'job_type': string;
  'is_queued_or_running': boolean;
}

export class JobStatusSummary {
  jobType: string;
  isQueuedOrRunning: boolean;

  constructor(jobType: string, isQueuedOrRunning: boolean) {
    this.jobType = jobType;
    this.isQueuedOrRunning = isQueuedOrRunning;
  }

  static createFromBackendDict(
      backendDict: JobStatusSummaryBackendDict): JobStatusSummary {
    return new JobStatusSummary(
      backendDict.job_type, backendDict.is_queued_or_running);
  }
}
