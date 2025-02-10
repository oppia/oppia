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
 * @fileoverview Component for viewing the output of an Apache Beam job.
 */

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {of, Subscription} from 'rxjs';
import {catchError, first} from 'rxjs/operators';

import {BeamJobRunResult} from 'domain/jobs/beam-job-run-result.model';
import {BeamJobRun} from 'domain/jobs/beam-job-run.model';
import {ReleaseCoordinatorBackendApiService} from 'pages/release-coordinator-page/services/release-coordinator-backend-api.service';
import {AlertsService} from 'services/alerts.service';

@Component({
  selector: 'view-beam-job-output-dialog',
  templateUrl: './view-beam-job-output-dialog.component.html',
})
export class ViewBeamJobOutputDialogComponent implements OnInit, OnDestroy {
  selectedTab = new FormControl(0);
  // Output is null if the job has not finished yet.
  output: BeamJobRunResult | null = null;
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  subscription!: Subscription;

  constructor(
    @Inject(MAT_DIALOG_DATA) public beamJobRun: BeamJobRun,
    public matDialogRef: MatDialogRef<ViewBeamJobOutputDialogComponent>,
    private alertsService: AlertsService,
    private backendApiService: ReleaseCoordinatorBackendApiService
  ) {}

  ngOnInit(): void {
    this.subscription = this.backendApiService
      .getBeamJobRunOutput(this.beamJobRun)
      .pipe(
        first(),
        catchError(error => {
          this.alertsService.addWarning(error.message);
          return of(null);
        })
      )
      .subscribe(output => (this.output = output));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getOutput(): string {
    if (!this.output) {
      return '';
    }
    if (this.output.stdout && this.output.stderr) {
      return this.selectedTab.value ? this.output.stderr : this.output.stdout;
    } else if (this.output.stdout) {
      return this.output.stdout;
    } else {
      return this.output.stderr;
    }
  }
}
