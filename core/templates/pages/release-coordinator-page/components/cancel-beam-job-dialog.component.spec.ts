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
 * @fileoverview Unit tests for the CancelBeamJobDialogComponent.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { of, throwError } from 'rxjs';

import { ReleaseCoordinatorBackendApiService } from 'pages/release-coordinator-page/services/release-coordinator-backend-api.service';
import { CancelBeamJobDialogComponent } from 'pages/release-coordinator-page/components/cancel-beam-job-dialog.component';
import { BeamJobRun } from 'domain/jobs/beam-job-run.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AlertsService } from 'services/alerts.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('Cancel beam job dialog', () => {
  const beamJobRun = (
    new BeamJobRun('123', 'FooJob', 'RUNNING', 0, 0, false));

  let fixture: ComponentFixture<CancelBeamJobDialogComponent>;
  let component: CancelBeamJobDialogComponent;

  let backendApiService: ReleaseCoordinatorBackendApiService;
  let alertsService: AlertsService;
  let matDialogRef: MatDialogRef<CancelBeamJobDialogComponent, BeamJobRun>;

  beforeEach(waitForAsync(async() => {
    const mockDialogRef = { disableClose: false, close: () => {} };

    TestBed.configureTestingModule({
      declarations: [
        CancelBeamJobDialogComponent,
      ],
      imports: [
        HttpClientTestingModule,
        BrowserDynamicTestingModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatIconModule,
        MatProgressBarModule,
        MatTooltipModule,
        NoopAnimationsModule,
      ],
      providers: [
        ReleaseCoordinatorBackendApiService,
        { provide: MAT_DIALOG_DATA, useValue: beamJobRun },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    });
    // NOTE: This allows tests to compile the DOM of each dialog component.
    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          CancelBeamJobDialogComponent,
        ],
      }
    });
    await TestBed.compileComponents();

    backendApiService = TestBed.inject(ReleaseCoordinatorBackendApiService);
    alertsService = TestBed.inject(AlertsService);
    matDialogRef = TestBed.inject(MatDialogRef);

    fixture = TestBed.createComponent(CancelBeamJobDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should lock the dialog and cancel the job before finally closing', () => {
    const cancelledBeamJobRun = (
      new BeamJobRun('123', 'FooJob', 'CANCELLED', 0, 0, false));
    const caneclBeamJobRunSpy = spyOn(backendApiService, 'cancelBeamJobRun')
      .and.returnValue(of(cancelledBeamJobRun));
    const closeDialogSpy = spyOn(matDialogRef, 'close');

    expect(component.isRunning).toBeFalse();
    expect(matDialogRef.disableClose).toBeFalse();

    component.onActionClick();

    expect(component.isRunning).toBeTrue();
    expect(matDialogRef.disableClose).toBeTrue();

    fixture.detectChanges();

    expect(caneclBeamJobRunSpy).toHaveBeenCalledWith(beamJobRun);
    expect(closeDialogSpy).toHaveBeenCalledWith(cancelledBeamJobRun);
  });

  it('should show the error dialog if the operation failed', async() => {
    const error = new Error();
    const cancelBeamJobRunSpy = spyOn(backendApiService, 'cancelBeamJobRun')
      .and.returnValue(throwError(error));
    const addWarningSpy = spyOn(alertsService, 'addWarning');

    component.onActionClick();

    fixture.detectChanges();
    expect(cancelBeamJobRunSpy).toHaveBeenCalledWith(beamJobRun);
    expect(addWarningSpy).toHaveBeenCalled();
  });
});
