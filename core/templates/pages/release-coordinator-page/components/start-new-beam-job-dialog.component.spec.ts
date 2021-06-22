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
 * @fileoverview Unit tests for the StartNewBeamJobDialogComponent.
 */

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { BeamJobRun } from 'domain/admin/beam-job-run.model';
import { BeamJob } from 'domain/admin/beam-job.model';
import { StartNewBeamJobDialogComponent } from 'pages/release-coordinator-page/components/start-new-beam-job-dialog.component';
import { ReleaseCoordinatorBackendApiService } from 'pages/release-coordinator-page/services/release-coordinator-backend-api.service';
import { AlertDialogComponent } from 'pages/release-coordinator-page/components/alert-dialog.component';

describe('Start new beam job dialog', () => {
  const beamJob = new BeamJob('FooJob');

  let fixture: ComponentFixture<StartNewBeamJobDialogComponent>;
  let component: StartNewBeamJobDialogComponent;
  let loader: HarnessLoader;

  let backendApiService: ReleaseCoordinatorBackendApiService;
  let matDialogRef: MatDialogRef<StartNewBeamJobDialogComponent, BeamJobRun>;

  beforeEach(waitForAsync(async() => {
    const mockDialogRef = { disableClose: false, close: () => {} };

    await TestBed.configureTestingModule({
      declarations: [
        AlertDialogComponent,
        StartNewBeamJobDialogComponent,
      ],
      imports: [
        MatDialogModule,
        MatButtonModule,
        MatProgressBarModule,
        NoopAnimationsModule,
        BrowserDynamicTestingModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: beamJob },
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: ReleaseCoordinatorBackendApiService,
          useValue: jasmine.createSpyObj<ReleaseCoordinatorBackendApiService>(
            'ReleaseCoordinatorBackendApiService', null, {
              startNewBeamJob: _ => of(null)
            }),
        },
      ],
    }).overrideModule(BrowserDynamicTestingModule, {
      set: { entryComponents: [AlertDialogComponent] }
    }).compileComponents();

    backendApiService = TestBed.inject(ReleaseCoordinatorBackendApiService);
    matDialogRef = TestBed.inject(MatDialogRef);

    fixture = TestBed.createComponent(StartNewBeamJobDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // NOTE: This must use .documentRootLoader(), otherwise the DOM elements
    // within the dialog components won't be found.
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  }));

  it('should lock the dialog and start a job before finally closing', () => {
    const newBeamJobRun = (
      new BeamJobRun('123', 'FooJob', 'PENDING', [], 0, 0, false));
    const startNewBeamJobSpy = spyOn(backendApiService, 'startNewBeamJob')
      .and.returnValue(of(newBeamJobRun));
    const closeDialogSpy = spyOn(matDialogRef, 'close');

    expect(component.isRunning).toBeFalse();
    expect(matDialogRef.disableClose).toBeFalse();

    component.onActionClick();

    expect(component.isRunning).toBeTrue();
    expect(matDialogRef.disableClose).toBeTrue();

    fixture.detectChanges();

    expect(startNewBeamJobSpy).toHaveBeenCalledWith(beamJob, []);
    expect(closeDialogSpy).toHaveBeenCalledWith(newBeamJobRun);
  });

  it('should show the error dialog if the operation failed', async() => {
    const error = new Error();
    const startNewBeamJobSpy = spyOn(backendApiService, 'startNewBeamJob')
      .and.returnValue(throwError(error));

    component.onActionClick();

    fixture.detectChanges();
    expect(startNewBeamJobSpy).toHaveBeenCalledWith(beamJob, []);

    let alertDialogs = await loader.getAllHarnesses(MatDialogHarness);
    expect(alertDialogs.length).toEqual(1);

    alertDialogs[0].close();

    fixture.detectChanges();
    alertDialogs = await loader.getAllHarnesses(MatDialogHarness);
    expect(alertDialogs.length).toEqual(0);
  });
});
