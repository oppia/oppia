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
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { marbles } from 'rxjs-marbles';

import { BeamJobRunResult } from 'domain/jobs/beam-job-run-result.model';
import { BeamJobRun } from 'domain/jobs/beam-job-run.model';
import { ViewBeamJobOutputDialogComponent } from 'pages/release-coordinator-page/components/view-beam-job-output-dialog.component';
import { ReleaseCoordinatorBackendApiService } from 'pages/release-coordinator-page/services/release-coordinator-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('View beam job output dialog', () => {
  const beamJobRun = new BeamJobRun('123', 'FooJob', 'DONE', 0, 0, false);

  let fixture: ComponentFixture<ViewBeamJobOutputDialogComponent>;
  let component: ViewBeamJobOutputDialogComponent;

  let backendApiService: ReleaseCoordinatorBackendApiService;
  let alertsService: AlertsService;

  beforeEach(waitForAsync(async() => {
    const mockDialogRef = { disableClose: false, close: () => {} };

    TestBed.configureTestingModule({
      declarations: [
        ViewBeamJobOutputDialogComponent,
      ],
      imports: [
        HttpClientTestingModule,
        BrowserDynamicTestingModule,
        ClipboardModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatIconModule,
        MatProgressBarModule,
        MatTabsModule,
        MatTooltipModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: beamJobRun },
        { provide: MatDialogRef, useValue: mockDialogRef },
        ReleaseCoordinatorBackendApiService,
      ],
    });
    // NOTE: This allows tests to compile the DOM of each dialog component.
    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          ViewBeamJobOutputDialogComponent,
        ],
      }
    });
    await TestBed.compileComponents();

    backendApiService = TestBed.inject(ReleaseCoordinatorBackendApiService);
    alertsService = TestBed.inject(AlertsService);

    fixture = TestBed.createComponent(ViewBeamJobOutputDialogComponent);
    component = fixture.componentInstance;
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
        .and.returnValue(of(result)));

    fixture.detectChanges();

    expect(getBeamJobRunOutputSpy).toHaveBeenCalledWith(beamJobRun);
    expect(component.output).toEqual(result);
  });

  it('should use the output corresponding to the selected tab', () => {
    const getBeamJobRunOutputSpy = (
      spyOn(backendApiService, 'getBeamJobRunOutput')
        .and.returnValue(of(new BeamJobRunResult('abc', '123'))));

    fixture.detectChanges();

    expect(getBeamJobRunOutputSpy).toHaveBeenCalledWith(beamJobRun);
    expect(component.getOutput()).toEqual('abc');

    component.selectedTab.setValue(1);
    fixture.detectChanges();

    expect(component.getOutput()).toEqual('123');

    component.selectedTab.setValue(0);
    fixture.detectChanges();

    expect(component.getOutput()).toEqual('abc');
  });

  it('should show stderr when stdout is empty', () => {
    const getBeamJobRunOutputSpy = (
      spyOn(backendApiService, 'getBeamJobRunOutput')
        .and.returnValue(of(new BeamJobRunResult('', '123'))));

    fixture.detectChanges();

    expect(getBeamJobRunOutputSpy).toHaveBeenCalledWith(beamJobRun);
    expect(component.getOutput()).toEqual('123');
  });

  it('should show stdout when stderr is empty', () => {
    const getBeamJobRunOutputSpy = (
      spyOn(backendApiService, 'getBeamJobRunOutput')
        .and.returnValue(of(new BeamJobRunResult('abc', ''))));

    fixture.detectChanges();

    expect(getBeamJobRunOutputSpy).toHaveBeenCalledWith(beamJobRun);
    expect(component.getOutput()).toEqual('abc');
  });

  it('should show the error dialog if the operation failed', async() => {
    const error = new Error();
    const getBeamJobRunOutputSpy = (
      spyOn(backendApiService, 'getBeamJobRunOutput')
        .and.returnValue(throwError(error)));
    const addWarningSpy = spyOn(alertsService, 'addWarning').and.stub();

    fixture.detectChanges();

    expect(getBeamJobRunOutputSpy).toHaveBeenCalledWith(beamJobRun);
    expect(addWarningSpy).toHaveBeenCalled();
  });
});
