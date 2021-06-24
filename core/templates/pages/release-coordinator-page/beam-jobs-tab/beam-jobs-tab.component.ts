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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { downgradeComponent } from '@angular/upgrade/static';
import { BehaviorSubject, combineLatest, Observable, of, zip } from 'rxjs';
import { catchError, distinctUntilChanged, first, map, startWith } from 'rxjs/operators';

import { BeamJobRun } from 'domain/jobs/beam-job-run.model';
import { BeamJob } from 'domain/jobs/beam-job.model';
import { CancelBeamJobDialogComponent } from 'pages/release-coordinator-page/components/cancel-beam-job-dialog.component';
import { StartNewBeamJobDialogComponent } from 'pages/release-coordinator-page/components/start-new-beam-job-dialog.component';
import { ViewBeamJobOutputDialogComponent } from 'pages/release-coordinator-page/components/view-beam-job-output-dialog.component';
import { ReleaseCoordinatorBackendApiService } from 'pages/release-coordinator-page/services/release-coordinator-backend-api.service';
import { AlertsService } from 'services/alerts.service';

@Component({
  selector: 'oppia-beam-jobs-tab',
  templateUrl: './beam-jobs-tab.component.html'
})
export class BeamJobsTabComponent implements OnInit, OnDestroy {
  public dataFailedToLoad = false;
  readonly jobRunTableColumns: readonly string[] = [
    'run_status', 'job_name', 'started_on', 'ended_on', 'action'];

  jobNameControl = new FormControl('');

  dataIsReady = false;
  beamJobs: BeamJob[] = null;
  selectedJob: BeamJob = null;

  jobNames = new BehaviorSubject<string[]>([]);
  beamJobRuns = new BehaviorSubject<BeamJobRun[]>([]);
  filteredJobNames: Observable<string[]>;
  filteredBeamJobRuns: Observable<BeamJobRun[]>;

  constructor(
      private backendApiService: ReleaseCoordinatorBackendApiService,
      private alertsService: AlertsService,
      private matDialog: MatDialog) {}

  ngOnInit(): void {
    const initialBeamJobs = this.backendApiService.getBeamJobs()
      .pipe(catchError(error => this.onError<BeamJob>(error)));
    const initialBeamJobRuns = this.backendApiService.getBeamJobRuns()
      .pipe(catchError(error => this.onError<BeamJobRun>(error)));

    zip(initialBeamJobs, initialBeamJobRuns)
      .pipe(first())
      .subscribe(([beamJobs, beamJobRuns]) => {
        this.beamJobs = beamJobs;
        this.jobNames.next(beamJobs.map(beamJob => beamJob.name));
        this.beamJobRuns.next(beamJobRuns);
        this.dataIsReady = true;
      });

    const jobNameInputChanges = this.jobNameControl.valueChanges
      .pipe(startWith(''), distinctUntilChanged());

    jobNameInputChanges.subscribe(input => {
      if (this.selectedJob?.name !== input) {
        this.selectedJob = null;
      }
    });

    this.filteredJobNames = combineLatest([jobNameInputChanges, this.jobNames])
      .pipe(map(filterArgs => this.filterJobNames(...filterArgs)));

    this.filteredBeamJobRuns = (
      combineLatest([this.beamJobRuns, this.filteredJobNames]).pipe(
        map(
          ([runs, jobNames]) => runs.filter(r => jobNames.includes(r.jobName))
        )
      )
    );
  }

  ngOnDestroy(): void {
    this.jobNames.complete();
    this.beamJobRuns.complete();
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
      .open(StartNewBeamJobDialogComponent, { data: this.selectedJob })
      .afterClosed().pipe(first()).subscribe(newBeamJobRun => {
        if (newBeamJobRun) {
          this.addNewBeamJobRun(newBeamJobRun);
        }
      });
  }

  onCancelClick(beamJobRun: BeamJobRun): void {
    this.matDialog
      .open(CancelBeamJobDialogComponent, { data: beamJobRun })
      .afterClosed().pipe(first()).subscribe(cancelledBeamJobRun => {
        if (cancelledBeamJobRun) {
          this.replaceBeamJobRun(beamJobRun, cancelledBeamJobRun);
        }
      });
  }

  onViewOutputClick(beamJobRun: BeamJobRun): void {
    this.matDialog.open(ViewBeamJobOutputDialogComponent, { data: beamJobRun });
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

angular.module('oppia').directive(
  'oppiaBeamJobsTab', downgradeComponent({ component: BeamJobsTabComponent }));
