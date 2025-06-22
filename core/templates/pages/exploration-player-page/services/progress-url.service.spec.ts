// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the ProgressUrlService.
 */

import {fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {ProgressUrlService} from './progress-url.service';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {PageContextService} from 'services/page-context.service';
import {CheckpointProgressService} from './checkpoint-progress.service';
import {ExplorationEngineService} from './exploration-engine.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TranslateModule} from '@ngx-translate/core';

describe('ProgressUrlService', () => {
  let progressUrlService: ProgressUrlService;
  let editableExplorationBackendApiService: EditableExplorationBackendApiService;
  let pageContextService: PageContextService;
  let checkpointProgressService: CheckpointProgressService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        ProgressUrlService,
        EditableExplorationBackendApiService,
        PageContextService,
        CheckpointProgressService,
        ExplorationEngineService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    progressUrlService = TestBed.inject(ProgressUrlService);
    editableExplorationBackendApiService = TestBed.inject(
      EditableExplorationBackendApiService
    );
    pageContextService = TestBed.inject(PageContextService);
    checkpointProgressService = TestBed.inject(CheckpointProgressService);
  });

  it('should be created', () => {
    expect(progressUrlService).toBeTruthy();
  });

  it('should throw error if exploration version is not available', async () => {
    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp123');
    spyOn(
      checkpointProgressService,
      'getLastCompletedCheckpoint'
    ).and.returnValue('checkpoint_id');
    spyOn(pageContextService, 'getExplorationVersion').and.returnValue(null);

    await expectAsync(
      progressUrlService.setUniqueProgressUrlId()
    ).toBeRejectedWithError(
      'Exploration version is not available. Cannot set unique progress URL ID.'
    );
  });

  it('should set unique progress URL ID correctly', fakeAsync(() => {
    spyOn(pageContextService, 'getExplorationId').and.returnValue(
      'exploration_id'
    );
    spyOn(
      checkpointProgressService,
      'getLastCompletedCheckpoint'
    ).and.returnValue('checkpoint_id');
    spyOn(pageContextService, 'getExplorationVersion').and.returnValue(1);
    spyOn(
      editableExplorationBackendApiService,
      'recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner'
    ).and.returnValue(
      Promise.resolve({unique_progress_url_id: 'unique_progress_url_id'})
    );

    progressUrlService.setUniqueProgressUrlId();
    tick(100);

    expect(progressUrlService.uniqueProgressUrlId).toBe(
      'unique_progress_url_id'
    );
    expect(
      editableExplorationBackendApiService.recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner
    ).toHaveBeenCalledWith('exploration_id', 1, 'checkpoint_id');
  }));

  it('should return the unique progress URL ID when it is set', () => {
    const uniqueProgressUrlId = 'unique_progress_url_id';
    progressUrlService.uniqueProgressUrlId = uniqueProgressUrlId;

    expect(progressUrlService.getUniqueProgressUrlId()).toBe(
      uniqueProgressUrlId
    );
  });
});
