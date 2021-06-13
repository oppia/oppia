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

import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { catchError, first } from 'rxjs/operators';

import { BeamJobRun } from 'domain/admin/beam-job-run.model';
import { ReleaseCoordinatorBackendApiService } from 'pages/release-coordinator-page/services/release-coordinator-backend-api.service';
import { BeamJobRunResult } from 'domain/admin/beam-job-run-result.model';
import { AlertDialogComponent } from 'pages/release-coordinator-page/components/alert-dialog.component';

@Component({
  selector: 'view-beam-job-output-dialog',
  templateUrl: './view-beam-job-output-dialog.component.html',
})
export class ViewBeamJobOutputDialogComponent implements OnInit, OnDestroy {
  output: BeamJobRunResult = null;
  subscription: Subscription = null;

  constructor(
      @Inject(MAT_DIALOG_DATA) public beamJobRun: BeamJobRun,
      public dialogRef: MatDialogRef<ViewBeamJobOutputDialogComponent>,
      private matDialog: MatDialog,
      private backendApiService: ReleaseCoordinatorBackendApiService) {}

  ngOnInit(): void {
    this.subscription = (
      this.backendApiService.getBeamJobRunOutput(this.beamJobRun).pipe(
        first(),
        catchError(
          data =>
            this.matDialog.open(AlertDialogComponent, { data }).afterClosed()))
    ).subscribe(output => this.output = output);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
