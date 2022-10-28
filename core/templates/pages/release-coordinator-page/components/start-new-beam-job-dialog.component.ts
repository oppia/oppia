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
 * @fileoverview Component for starting a new Apache Beam job.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { catchError, take } from 'rxjs/operators';

import { BeamJob } from 'domain/jobs/beam-job.model';
import { BeamJobRun } from 'domain/jobs/beam-job-run.model';
import { ReleaseCoordinatorBackendApiService } from 'pages/release-coordinator-page/services/release-coordinator-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { of } from 'rxjs';
import { AppConstants } from 'app.constants';

@Component({
  selector: 'start-new-beam-job-dialog',
  templateUrl: './start-new-beam-job-dialog.component.html',
})
export class StartNewBeamJobDialogComponent {
  readonly DEV_MODE: boolean = AppConstants.DEV_MODE;
  isRunning = false;

  constructor(
      @Inject(MAT_DIALOG_DATA) public beamJob: BeamJob,
      private matDialogRef:
        // JobRun may be null if the job failed to start.
        MatDialogRef<StartNewBeamJobDialogComponent, BeamJobRun | null>,
      private alertsService: AlertsService,
      private backendApiService: ReleaseCoordinatorBackendApiService) {}

  onActionClick(): void {
    this.isRunning = true;
    this.matDialogRef.disableClose = true;

    this.backendApiService.startNewBeamJob(this.beamJob).pipe(
      take(1),
      catchError(error => {
        this.alertsService.addWarning(error.message);
        return of(null);
      })
    ).subscribe(newJobRun => this.matDialogRef.close(newJobRun));
  }
}
