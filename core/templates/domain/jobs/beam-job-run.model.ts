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
 * @fileoverview Domain object for an Apache Beam job invocation.
 *
 * These are distinct from BeamJob in that BeamJobRun represents a specific
 * invocation of an Apache Beam job, whereas the former represents the
 * definition of one.
 */

export type BeamJobRunState = (
  // The job is currently running.
  'RUNNING' |
  // The job has been created but is not yet running. Jobs that are pending may
  // only transition to RUNNING, or FAILED.
  'PENDING' |
  // The job has not yet started to run.
  'STOPPED' |
  // The job has has been explicitly cancelled and is in the process of
  // stopping. Jobs that are cancelling may only transition to CANCELLED or
  // FAILED.
  'CANCELLING' |
  // The job has has been explicitly cancelled. This is a terminal job state.
  // This state may only be set via a Cloud Dataflow jobs.update call, and only
  // if the job has not yet reached another terminal state.
  'CANCELLED' |
  // The job is in the process of draining. A draining job has stopped pulling
  // from its input sources and is processing any data that remains in-flight.
  // This state may be set via a Cloud Dataflow jobs.update call, but only as a
  // transition from RUNNING. Jobs that are draining may only transition to
  // DRAINED, CANCELLED, or FAILED.
  'DRAINING' |
  // The job has been drained. A drained job terminated by stopping pulling from
  // its input sources and processing any data that remained in-flight when
  // draining was requested. This state is a terminal state, may only be set by
  // the Cloud Dataflow service, and only as a transition from DRAINING.
  'DRAINED' |
  // The job was successfully updated, meaning that this job was stopped and
  // another job was started, inheriting state from this one. This is a terminal
  // job state. This state may only be set by the Cloud Dataflow service, and
  // only as a transition from RUNNING.
  'UPDATED' |
  // The job has successfully completed. This is a terminal job state. This
  // state may be set by the Cloud Dataflow service, as a transition from
  // RUNNING. It may also be set via a Cloud Dataflow jobs.update call, if the
  // job has not yet reached a terminal state.
  'DONE' |
  // The job has has failed. This is a terminal job state. This state may only
  // be set by the Cloud Dataflow service, and only as a transition from
  // RUNNING.
  'FAILED' |
  // The job's run state isn't specified.
  'UNKNOWN'
);

class MatIcon {
  constructor(
      public readonly tooltip: string,
      public readonly code: string,
      // The color is null for the job state 'cancelling', 'cancelled' and
      // 'drained' since we want their respective icons to use the default
      // font color of the component and not any of the theme colors.
      public readonly color: string | null) {}
}

export interface BeamJobRunBackendDict {
  'job_id': string;
  'job_name': string;
  'job_state': BeamJobRunState;
  'job_started_on_msecs': number;
  'job_updated_on_msecs': number;
  'job_is_synchronous': boolean;
}

export class BeamJobRun {
  private matIcon: MatIcon;

  constructor(
      public readonly jobId: string,
      public readonly jobName: string,
      public readonly jobState: BeamJobRunState,
      public readonly jobStartedOnMsecs: number,
      public readonly jobUpdatedOnMsecs: number,
      public readonly jobIsSynchronous: boolean) {
    switch (jobState) {
      case 'RUNNING':
        this.matIcon = new MatIcon('Running...', 'run_circle', 'accent');
        break;
      case 'PENDING':
        this.matIcon = new MatIcon('Pending...', 'pending', 'accent');
        break;
      case 'STOPPED':
        this.matIcon = new MatIcon('Paused', 'pause_circle', 'accent');
        break;
      case 'CANCELLING':
        this.matIcon = new MatIcon('Cancelling...', 'pending', null);
        break;
      case 'CANCELLED':
        this.matIcon = new MatIcon('Cancelled', 'cancel', null);
        break;
      case 'DRAINING':
        this.matIcon = new MatIcon('Draining...', 'hourglass_top', 'accent');
        break;
      case 'DRAINED':
        this.matIcon = new MatIcon('Drained', 'hourglass_bottom', null);
        break;
      case 'UPDATED':
        this.matIcon = (
          new MatIcon('Updated', 'published_with_changes', 'primary'));
        break;
      case 'DONE':
        this.matIcon = new MatIcon('Done!', 'check_circle', 'primary');
        break;
      case 'FAILED':
        this.matIcon = new MatIcon('Failed!', 'error', 'warn');
        break;
      case 'UNKNOWN':
        this.matIcon = new MatIcon('Unknown', 'help', 'warn');
        break;
    }
  }

  getJobStatusTooltipString(): string {
    return this.matIcon.tooltip;
  }

  getJobStatusMaterialIconCode(): string {
    return this.matIcon.code;
  }

  // This will return null if the current font color of the
  // component is to be used as the color for the icon.
  getJobStatusMaterialThemeColor(): string | null {
    return this.matIcon.color;
  }

  inTerminalState(): boolean {
    switch (this.jobState) {
      case 'CANCELLED':
      case 'DRAINED':
      case 'UPDATED':
      case 'DONE':
      case 'FAILED':
        return true;
      default:
        return false;
    }
  }

  isRunning(): boolean {
    return !this.inTerminalState();
  }

  isFailed(): boolean {
    return this.jobState === 'FAILED';
  }

  canBeCancelled(): boolean {
    return !this.inTerminalState() && this.jobState !== 'CANCELLING';
  }

  hasOutput(): boolean {
    switch (this.jobState) {
      case 'DRAINED':
      case 'DONE':
      case 'FAILED':
        return true;
      default:
        return false;
    }
  }

  static createFromBackendDict(backendDict: BeamJobRunBackendDict): BeamJobRun {
    return new BeamJobRun(
      backendDict.job_id, backendDict.job_name, backendDict.job_state,
      backendDict.job_started_on_msecs, backendDict.job_updated_on_msecs,
      backendDict.job_is_synchronous);
  }
}
