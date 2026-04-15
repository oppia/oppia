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
 * @fileoverview Unit tests for BeamJobsTabComponent.
 */

import {ClipboardModule} from '@angular/cdk/clipboard';
import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatAutocompleteHarness} from '@angular/material/autocomplete/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonHarness} from '@angular/material/button/testing';
import {MatCardModule} from '@angular/material/card';
import {MatDialogModule} from '@angular/material/dialog';
import {MatDialogHarness} from '@angular/material/dialog/testing';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatInputHarness} from '@angular/material/input/testing';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatTableModule} from '@angular/material/table';
import {MatTableHarness} from '@angular/material/table/testing';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BrowserDynamicTestingModule} from '@angular/platform-browser-dynamic/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {marbles} from 'rxjs-marbles';
import {BeamJobsTabComponent} from './beam-jobs-tab.component';

import {BeamJobRun} from 'domain/jobs/beam-job-run.model';
import {BeamJob} from 'domain/jobs/beam-job.model';
import {CancelBeamJobDialogComponent} from 'pages/release-coordinator-page/components/cancel-beam-job-dialog.component';
import {StartNewBeamJobDialogComponent} from 'pages/release-coordinator-page/components/start-new-beam-job-dialog.component';
import {ViewBeamJobOutputDialogComponent} from 'pages/release-coordinator-page/components/view-beam-job-output-dialog.component';
import {ReleaseCoordinatorBackendApiService} from 'pages/release-coordinator-page/services/release-coordinator-backend-api.service';
import {BeamJobRunResult} from 'domain/jobs/beam-job-run-result.model';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('Beam Jobs Tab Component', () => {
  let fixture: ComponentFixture<BeamJobsTabComponent>;
  let component: BeamJobsTabComponent;
  let loader: HarnessLoader;

  let backendApiService: ReleaseCoordinatorBackendApiService;

  const fooJob = new BeamJob('FooJob');
  const barJob = new BeamJob('BarJob');
  const bazJob = new BeamJob('BazJob');
  const beamJobs = [fooJob, barJob, bazJob];

  const runningFooJob = new BeamJobRun('123', 'FooJob', 'RUNNING', 0, 0, false);
  const pendingBarJob = new BeamJobRun('456', 'BarJob', 'PENDING', 0, 0, false);
  const doneBarJob = new BeamJobRun('789', 'BarJob', 'DONE', 0, 0, false);
  const beamJobRuns = [runningFooJob, pendingBarJob, doneBarJob];
  const terminalBeamJobRuns = [doneBarJob];

  beforeEach(waitForAsync(async () => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ClipboardModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule,
        MatTableModule,
        MatTabsModule,
        MatTooltipModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
      ],
      declarations: [
        BeamJobsTabComponent,
        CancelBeamJobDialogComponent,
        StartNewBeamJobDialogComponent,
        ViewBeamJobOutputDialogComponent,
      ],
      providers: [
        {
          provide: ReleaseCoordinatorBackendApiService,
          useValue: jasmine.createSpyObj<ReleaseCoordinatorBackendApiService>(
            'ReleaseCoordinatorBackendApiService',
            {},
            {
              getBeamJobs: () => of(beamJobs),
              getBeamJobRuns: () => of(beamJobRuns),
              startNewBeamJob: () =>
                of(new BeamJobRun('123', 'FooJob', 'RUNNING', 0, 0, false)),
              cancelBeamJobRun: () =>
                of(new BeamJobRun('123', 'FooJob', 'CANCELLED', 0, 0, false)),
              getBeamJobRunOutput: () => of(new BeamJobRunResult('abc', '123')),
            } as Partial<ReleaseCoordinatorBackendApiService>
          ),
        },
      ],
    });
    // NOTE: This allows tests to compile the DOM of each dialog component.
    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          BeamJobsTabComponent,
          CancelBeamJobDialogComponent,
          StartNewBeamJobDialogComponent,
          ViewBeamJobOutputDialogComponent,
        ],
      },
    });

    await TestBed.compileComponents();

    backendApiService = TestBed.inject(ReleaseCoordinatorBackendApiService);

    fixture = TestBed.createComponent(BeamJobsTabComponent);
    component = fixture.componentInstance;
    // NOTE: This must use .documentRootLoader(), otherwise the DOM elements
    // within the dialog components won't be found.
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  }));

  it(
    'should wait until both jobs and runs are emitted',
    marbles(m => {
      const beamJobsOutput = m.hot('   ^-j---|', {j: beamJobs});
      const beamJobRunsOutput = m.hot('^---r-|', {r: beamJobRuns});
      const expectedNames = '          e---n--';
      const expectedRuns = '           e---r--';
      spyOn(backendApiService, 'getBeamJobs').and.returnValue(beamJobsOutput);
      spyOn(backendApiService, 'getBeamJobRuns').and.returnValue(
        beamJobRunsOutput
      );

      fixture.detectChanges();

      m.expect(component.jobNames).toBeObservable(expectedNames, {
        e: [],
        n: beamJobs.map(j => j.name),
      });
      m.expect(component.beamJobRuns).toBeObservable(expectedRuns, {
        e: [],
        r: beamJobRuns,
      });

      component.beamJobRunsRefreshIntervalSubscription.unsubscribe();
    })
  );

  it(
    'should return empty array when jobs fail to load',
    marbles(m => {
      const beamJobs = m.hot('^-#', undefined, new Error('err'));
      const expectedNames = ' e-e';
      spyOn(backendApiService, 'getBeamJobs').and.returnValue(beamJobs);

      fixture.detectChanges();
      m.expect(component.jobNames).toBeObservable(expectedNames, {e: []});

      component.beamJobRunsRefreshIntervalSubscription.unsubscribe();
    })
  );

  it(
    'should return empty array when runs fail to load',
    marbles(m => {
      const beamJobRuns = m.hot('^-#', undefined, new Error('err'));
      const expectedRuns = '     e-e';
      spyOn(backendApiService, 'getBeamJobRuns').and.returnValue(beamJobRuns);

      fixture.detectChanges();
      m.expect(component.beamJobRuns).toBeObservable(expectedRuns, {e: []});

      component.beamJobRunsRefreshIntervalSubscription.unsubscribe();
    })
  );

  it('should update the table when the job name input changes', async () => {
    const input = await loader.getHarness(MatInputHarness);
    const autocomplete = await loader.getHarness(MatAutocompleteHarness);
    const table = await loader.getHarness(MatTableHarness);

    await input.setValue('Fo');
    fixture.detectChanges();

    expect(await autocomplete.getOptions()).toHaveSize(1);
    expect(await table.getRows()).toHaveSize(1);

    await input.setValue('Fob');
    fixture.detectChanges();

    expect(await autocomplete.getOptions()).toHaveSize(0);
    expect(await table.getRows()).toHaveSize(0);

    await input.setValue('Ba');
    fixture.detectChanges();

    expect(await autocomplete.getOptions()).toHaveSize(2);
    expect(await table.getRows()).toHaveSize(2);

    component.ngOnDestroy();
  });

  it('should deselect a job after changing the input', async () => {
    const autocomplete = await loader.getHarness(MatAutocompleteHarness);
    const input = await loader.getHarness(MatInputHarness);

    expect(component.selectedJob).toBeUndefined();

    await input.setValue('FooJob');
    await autocomplete.selectOption({text: 'FooJob'});
    fixture.detectChanges();

    expect(component.selectedJob).toEqual(fooJob);

    await input.setValue('FooJo');
    fixture.detectChanges();

    expect(component.selectedJob).toBeUndefined();

    component.ngOnDestroy();
  });

  it('should add a new job after starting a new job run', async () => {
    const autocomplete = await loader.getHarness(MatAutocompleteHarness);
    const input = await loader.getHarness(MatInputHarness);

    const newPendingFooJob = new BeamJobRun(
      '123',
      'FooJob',
      'PENDING',
      0,
      0,
      false
    );
    const startNewJobSpy = spyOn(
      backendApiService,
      'startNewBeamJob'
    ).and.returnValue(of(newPendingFooJob));

    await input.setValue('FooJob');
    await autocomplete.selectOption({text: 'FooJob'});
    fixture.detectChanges();

    expect(component.beamJobRuns.value).not.toContain(newPendingFooJob);

    const startNewButton = await loader.getHarness(
      MatButtonHarness.with({
        text: 'play_arrow',
      })
    );
    await startNewButton.click();

    expect(await loader.getAllHarnesses(MatDialogHarness)).toHaveSize(1);

    const confirmButton = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Start New Job',
      })
    );
    await confirmButton.click();
    await fixture.whenStable();

    expect(startNewJobSpy).toHaveBeenCalledWith(fooJob);
    expect(await loader.getAllHarnesses(MatDialogHarness)).toHaveSize(0);
    expect(component.beamJobRuns.value).toContain(newPendingFooJob);

    component.ngOnDestroy();
  });

  it('should cancel the job and update its status', async () => {
    const autocomplete = await loader.getHarness(MatAutocompleteHarness);
    const input = await loader.getHarness(MatInputHarness);

    const cancellingFooJob = new BeamJobRun(
      '123',
      'FooJob',
      'CANCELLED',
      0,
      0,
      false
    );
    const cancelBeamJobRunSpy = spyOn(
      backendApiService,
      'cancelBeamJobRun'
    ).and.returnValue(of(cancellingFooJob));

    await input.setValue('FooJob');
    await autocomplete.selectOption({text: 'FooJob'});
    fixture.detectChanges();

    expect(component.beamJobRuns.value).toContain(runningFooJob);
    expect(component.beamJobRuns.value).not.toContain(cancellingFooJob);

    const cancelButton = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Cancel',
      })
    );
    await cancelButton.click();

    expect(await loader.getAllHarnesses(MatDialogHarness)).toHaveSize(1);

    const confirmButton = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Cancel this Job',
      })
    );
    await confirmButton.click();
    await fixture.whenStable();

    expect(cancelBeamJobRunSpy).toHaveBeenCalledWith(runningFooJob);
    expect(await loader.getAllHarnesses(MatDialogHarness)).toHaveSize(0);
    expect(component.beamJobRuns.value).not.toContain(runningFooJob);
    expect(component.beamJobRuns.value).toContain(cancellingFooJob);

    component.ngOnDestroy();
  });

  it('should show the job output', async () => {
    const autocomplete = await loader.getHarness(MatAutocompleteHarness);
    const input = await loader.getHarness(MatInputHarness);

    const getBeamJobRunOutputSpy = spyOn(
      backendApiService,
      'getBeamJobRunOutput'
    ).and.returnValue(of(new BeamJobRunResult('Lorem Ipsum', '')));

    await input.setValue('BarJob');
    await autocomplete.selectOption({text: 'BarJob'});
    fixture.detectChanges();

    const viewOutputButton = await loader.getHarness(
      MatButtonHarness.with({
        text: 'View Output',
      })
    );
    await viewOutputButton.click();

    const dialog = await loader.getHarness(MatDialogHarness);
    const dialogHost = await dialog.host();
    expect(await dialogHost.text()).toContain('Lorem Ipsum');
    await dialog.close();

    expect(getBeamJobRunOutputSpy).toHaveBeenCalledWith(doneBarJob);
    expect(await loader.getAllHarnesses(MatDialogHarness)).toHaveSize(0);

    component.ngOnDestroy();
  });

  it('should refresh the beam job runs every 15 seconds', fakeAsync(() => {
    const getBeamJobRunsSpy = spyOn(
      backendApiService,
      'getBeamJobRuns'
    ).and.returnValue(of(beamJobRuns));

    fixture.detectChanges();

    // The first time is called by ngOnInit().
    expect(getBeamJobRunsSpy).toHaveBeenCalledTimes(1);

    tick(BeamJobsTabComponent.BEAM_JOB_RUNS_REFRESH_INTERVAL_MSECS);
    fixture.detectChanges();

    // The second time is called out by our interval refresh timer.
    expect(getBeamJobRunsSpy).toHaveBeenCalledTimes(2);

    component.ngOnDestroy();
  }));

  it('should not refresh beam jobs if all jobs are terminal', fakeAsync(() => {
    const getBeamJobRunsSpy = spyOn(
      backendApiService,
      'getBeamJobRuns'
    ).and.returnValue(of(terminalBeamJobRuns));

    fixture.detectChanges();

    // The first time is called by ngOnInit().
    expect(getBeamJobRunsSpy).toHaveBeenCalledTimes(1);

    tick(BeamJobsTabComponent.BEAM_JOB_RUNS_REFRESH_INTERVAL_MSECS);
    fixture.detectChanges();

    // The second time should not be called out, because all jobs are terminal.
    expect(getBeamJobRunsSpy).toHaveBeenCalledTimes(1);

    component.ngOnDestroy();
  }));
});
