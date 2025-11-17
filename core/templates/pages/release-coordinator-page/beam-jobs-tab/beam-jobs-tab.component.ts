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
 * @fileoverview Component for the Apache Beam jobs tab of the
 * release-coordinator panel.
 */

import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {
  BehaviorSubject,
  combineLatest,
  interval,
  NEVER,
  Observable,
  of,
  Subscription,
  zip,
} from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  first,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';

import {BeamJobRun} from 'domain/jobs/beam-job-run.model';
import {BeamJob} from 'domain/jobs/beam-job.model';
import {CancelBeamJobDialogComponent} from 'pages/release-coordinator-page/components/cancel-beam-job-dialog.component';
import {StartNewBeamJobDialogComponent} from 'pages/release-coordinator-page/components/start-new-beam-job-dialog.component';
import {ViewBeamJobOutputDialogComponent} from 'pages/release-coordinator-page/components/view-beam-job-output-dialog.component';
import {ReleaseCoordinatorBackendApiService} from 'pages/release-coordinator-page/services/release-coordinator-backend-api.service';
import {AlertsService} from 'services/alerts.service';

@Component({
  selector: 'oppia-beam-jobs-tab',
  templateUrl: './beam-jobs-tab.component.html',
})
export class BeamJobsTabComponent implements OnInit, OnDestroy {
  static readonly BEAM_JOB_RUNS_REFRESH_INTERVAL_MSECS = 15000;

  public dataFailedToLoad = false;
  readonly jobRunTableColumns: readonly string[] = [
    'run_status',
    'job_name',
    'started_on',
    'updated_on',
    'action',
  ];

  jobNameControl = new FormControl('');

  dataIsReady = false;
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  beamJobs!: BeamJob[];
  filteredJobNames!: Observable<string[]>;
  filteredBeamJobRuns!: Observable<BeamJobRun[]>;
  beamJobRunsRefreshIntervalSubscription!: Subscription;
  // Selected job is undefined if no job is selected.
  selectedJob: BeamJob | undefined = undefined;
  jobNames = new BehaviorSubject<string[]>([]);
  beamJobRuns = new BehaviorSubject<BeamJobRun[]>([]);

  constructor(
    private backendApiService: ReleaseCoordinatorBackendApiService,
    private alertsService: AlertsService,
    private matDialog: MatDialog,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const initialBeamJobs = this.backendApiService
      .getBeamJobs()
      .pipe(catchError(error => this.onError<BeamJob>(error)));
    const initialBeamJobRuns = this.backendApiService
      .getBeamJobRuns()
      .pipe(catchError(error => this.onError<BeamJobRun>(error)));

    zip(initialBeamJobs, initialBeamJobRuns)
      .pipe(first())
      .subscribe(([beamJobs, beamJobRuns]) => {
        this.beamJobs = beamJobs;
        this.jobNames.next(beamJobs.map(beamJob => beamJob.name));
        this.beamJobRuns.next(beamJobRuns);
        this.dataIsReady = true;
      });

    const jobNameInputChanges = this.jobNameControl.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged()
    );

    jobNameInputChanges.subscribe(input => {
      if (this.selectedJob?.name !== input) {
        this.selectedJob = undefined;
      }
    });

    this.filteredJobNames = combineLatest([
      jobNameInputChanges,
      this.jobNames,
    ]).pipe(map(filterArgs => this.filterJobNames(...filterArgs)));

    this.filteredBeamJobRuns = combineLatest([
      this.beamJobRuns,
      this.filteredJobNames,
    ]).pipe(
      map(([runs, jobNames]) => runs.filter(r => jobNames.includes(r.jobName)))
    );

    // Intervals need to be executed *outside* of Angular so that they don't
    // interfere with testability (otherwise, the Angular component will never
    // be "ready" since an interval executes indefinitely).
    this.ngZone.runOutsideAngular(() => {
      this.beamJobRunsRefreshIntervalSubscription = interval(
        BeamJobsTabComponent.BEAM_JOB_RUNS_REFRESH_INTERVAL_MSECS
      )
        .pipe(
          switchMap(() => {
            // If every job in the current list is in a terminal state (won't
            // ever change), then we return NEVER (an Observable which neither
            // completes nor emits values) to avoid calling out to the backend.
            //
            // We do this because there's no point in trying to update the state
            // of jobs that have already reached their terminal (final) state.
            if (this.beamJobRuns.value.every(j => j.inTerminalState())) {
              return NEVER;
            } else {
              // Otherwise, try to reach out to the backend and retrieve an
              // update on the state of our jobs.
              return this.backendApiService.getBeamJobRuns();
            }
          })
        )
        .subscribe(beamJobRuns => {
          // When we're ready to update the beam jobs, we want the update to
          // execute *inside* of Angular so that change detection can notice.
          this.ngZone.run(() => this.beamJobRuns.next(beamJobRuns));
        });
    });
  }

  ngOnDestroy(): void {
    this.jobNames.complete();
    this.beamJobRuns.complete();
    this.beamJobRunsRefreshIntervalSubscription.unsubscribe();
  }

  onError<T>(error: Error): Observable<T[]> {
    this.dataFailedToLoad = true;
    this.alertsService.addWarning(error.message);
    return of([]);
  }

  onJobNameSelect(jobName: string): void {
    this.selectedJob = this.beamJobs.find(job => job.name === jobName);
  }

  onStartNewClick(ev: Event): void {
    // Don't trigger the input field, which is underneath the Start New button.
    ev.stopPropagation();

    this.matDialog
      .open(StartNewBeamJobDialogComponent, {data: this.selectedJob})
      .afterClosed()
      .pipe(first())
      .subscribe(newBeamJobRun => {
        if (newBeamJobRun) {
          this.addNewBeamJobRun(newBeamJobRun);
        }
      });
  }

  onCancelClick(beamJobRun: BeamJobRun): void {
    this.matDialog
      .open(CancelBeamJobDialogComponent, {data: beamJobRun})
      .afterClosed()
      .pipe(first())
      .subscribe(cancelledBeamJobRun => {
        if (cancelledBeamJobRun) {
          this.replaceBeamJobRun(beamJobRun, cancelledBeamJobRun);
        }
      });
  }

  onViewOutputClick(beamJobRun: BeamJobRun): void {
    this.matDialog.open(ViewBeamJobOutputDialogComponent, {data: beamJobRun});
  }

  private filterJobNames(input: string, jobNames: string[]): string[] {
    const filterValue = input.toLowerCase();
    return jobNames.filter(n => n.toLowerCase().includes(filterValue));
  }

  private addNewBeamJobRun(newRun: BeamJobRun): void {
    const newBeamJobRuns = this.beamJobRuns.value.slice();
    newBeamJobRuns.unshift(newRun);
    this.beamJobRuns.next(newBeamJobRuns);
  }

  private replaceBeamJobRun(oldRun: BeamJobRun, newRun: BeamJobRun): void {
    const newBeamJobRuns = this.beamJobRuns.value.slice();
    newBeamJobRuns.splice(newBeamJobRuns.indexOf(oldRun), 1, newRun);
    this.beamJobRuns.next(newBeamJobRuns);
  }
}
