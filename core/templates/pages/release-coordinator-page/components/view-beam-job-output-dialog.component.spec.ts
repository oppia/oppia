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

import { ClipboardModule } from '@angular/cdk/clipboard';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { marbles } from 'rxjs-marbles';

import { BeamJobRunResult } from 'domain/admin/beam-job-run-result.model';
import { BeamJobRun } from 'domain/admin/beam-job-run.model';
import { ViewBeamJobOutputDialogComponent } from 'pages/release-coordinator-page/components/view-beam-job-output-dialog.component';
import { ReleaseCoordinatorBackendApiService } from 'pages/release-coordinator-page/services/release-coordinator-backend-api.service';
import { AlertDialogComponent } from 'pages/release-coordinator-page/components/alert-dialog.component';

describe('View beam job output dialog', () => {
  const beamJobRun = new BeamJobRun('123', 'FooJob', 'DONE', [], 0, 0, false);

  let fixture: ComponentFixture<ViewBeamJobOutputDialogComponent>;
  let component: ViewBeamJobOutputDialogComponent;
  let loader: HarnessLoader;

  let backendApiService: ReleaseCoordinatorBackendApiService;

  beforeEach(waitForAsync(async() => {
    await TestBed.configureTestingModule({
      declarations: [
        AlertDialogComponent,
        ViewBeamJobOutputDialogComponent,
      ],
      imports: [
        BrowserDynamicTestingModule,
        ClipboardModule,
        MatButtonModule,
        MatDialogModule,
        MatProgressBarModule,
        MatTabsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: beamJobRun },
        { provide: MatDialogRef, useValue: {} },
        {
          provide: ReleaseCoordinatorBackendApiService,
          useValue: jasmine.createSpyObj<ReleaseCoordinatorBackendApiService>(
            'ReleaseCoordinatorBackendApiService', null, {
              getBeamJobRunOutput: _ => of(new BeamJobRunResult('', ''))
            }),
        },
      ],
    }).compileComponents();

    backendApiService = TestBed.inject(ReleaseCoordinatorBackendApiService);

    fixture = TestBed.createComponent(ViewBeamJobOutputDialogComponent);
    component = fixture.componentInstance;
    // NOTE: This must use .documentRootLoader(), otherwise the DOM elements
    // within the dialog components won't be found.
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  }));

  it('should unsubscribe when ngOnDestroy() is called', marbles(m => {
    // We will call ngOnDestroy() on frame 2, at which point an unsubscription
    // should occur. "Frames" are units of time in marble diagrams. There are
    // two kinds of marble diagrams: for Observables and for Subscriptions.
    //
    // In Observable marble diagrams, frame 0 is the '^' character, and each
    // non-whitespace character is 1 frame "later" in time. We use '-' to
    // move frames forward in time without taking action. The '|' character
    // represents the completion of the stream.
    //
    // In Subscription marble diagrams, the '^' represents the beginning of a
    // subscription and the '!' character represents its unsubscription. The '-'
    // characters hold the same meaning.
    const output = m.hot('        ^---|');
    const expectedSubscription = '^-!  ';
    m.scheduler.schedule(() => component.ngOnDestroy(), 2);

    spyOn(backendApiService, 'getBeamJobRunOutput').and.returnValue(output);

    fixture.detectChanges();

    m.expect(output).toHaveSubscriptions(expectedSubscription);
  }));

  it('should resolve the result and assign it to the output', () => {
    const result = new BeamJobRunResult('abc', '123');
    const getBeamJobRunOutputSpy = (
      spyOn(backendApiService, 'getBeamJobRunOutput')
        .and.returnValue(of(result))
    );

    expect(component.output).toBeNull();

    fixture.detectChanges();

    expect(getBeamJobRunOutputSpy).toHaveBeenCalledWith(beamJobRun);
    expect(component.output).toEqual(result);
  });

  it('should show the error dialog if the operation failed', async() => {
    const error = new Error();
    const getBeamJobRunOutputSpy = (
      spyOn(backendApiService, 'getBeamJobRunOutput')
        .and.returnValue(throwError(error)));

    fixture.detectChanges();
    expect(getBeamJobRunOutputSpy).toHaveBeenCalledWith(beamJobRun);

    let alertDialogs = await loader.getAllHarnesses(MatDialogHarness);
    expect(alertDialogs.length).toEqual(1);

    alertDialogs[0].close();

    fixture.detectChanges();
    alertDialogs = await loader.getAllHarnesses(MatDialogHarness);
    expect(alertDialogs.length).toEqual(0);
  });
});
