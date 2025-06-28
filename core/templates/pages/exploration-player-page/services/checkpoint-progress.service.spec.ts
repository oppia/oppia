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
 * @fileoverview Unit tests for the CheckpointProgressService.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';
import {CheckpointProgressService} from './checkpoint-progress.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TranslateModule} from '@ngx-translate/core';

describe('CheckpointProgressService', () => {
  let checkpointProgressService: CheckpointProgressService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [CheckpointProgressService],
    }).compileComponents();
  }));

  beforeEach(() => {
    checkpointProgressService = TestBed.inject(CheckpointProgressService);
  });

  it('should be created', () => {
    expect(checkpointProgressService).toBeTruthy();
  });

  it('should set and get last completed checkpoint correctly', () => {
    const checkpointStateName = 'checkpoint_1';
    checkpointProgressService.setMostRecentlyReachedCheckpoint(
      checkpointStateName
    );
    expect(checkpointProgressService.getMostRecentlyReachedCheckpoint()).toBe(
      checkpointStateName
    );
  });

  it('should return undefined if last completed checkpoint is not set', () => {
    expect(() =>
      checkpointProgressService.getMostRecentlyReachedCheckpoint()
    ).toThrowError();
  });

  it('should return visited checkpoint state names when they exist', () => {
    const expectedStateNames = ['checkpoint1', 'checkpoint2'];
    checkpointProgressService.visitedCheckpointStateNames = expectedStateNames;
    const result = checkpointProgressService.getVisitedCheckpointStateNames();
    expect(result).toEqual(expectedStateNames);
  });

  it('should throw an error when no checkpoints have been visited', () => {
    checkpointProgressService.visitedCheckpointStateNames = [];
    expect(() => {
      checkpointProgressService.getVisitedCheckpointStateNames();
    }).toThrowError('No checkpoints have been visited yet.');
  });
});
