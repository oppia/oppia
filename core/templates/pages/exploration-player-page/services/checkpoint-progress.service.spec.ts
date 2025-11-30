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
import {PlayerTranscriptService} from './player-transcript.service';
import {ExplorationEngineService} from './exploration-engine.service';

describe('CheckpointProgressService', () => {
  let checkpointProgressService: CheckpointProgressService;
  let playerTranscriptService: PlayerTranscriptService;
  let explorationEngineService: ExplorationEngineService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [CheckpointProgressService],
    }).compileComponents();
  }));

  beforeEach(() => {
    checkpointProgressService = TestBed.inject(CheckpointProgressService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
  });

  it('should be created', () => {
    expect(checkpointProgressService).toBeTruthy();
  });

  it('should get most recently reached checkpoint index correctly', () => {
    const mockCards = [
      {getStateName: () => 'Introduction'},
      {getStateName: () => 'Checkpoint1'},
      {getStateName: () => 'MiddleState'},
      {getStateName: () => 'Checkpoint2'},
    ];

    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(4);
    spyOn(playerTranscriptService, 'getCard').and.callFake((index: number) => {
      return mockCards[index];
    });
    spyOn(explorationEngineService, 'getStateFromStateName').and.callFake(
      (stateName: string) => {
        const checkpointStates = ['Checkpoint1', 'Checkpoint2'];
        return {cardIsCheckpoint: checkpointStates.includes(stateName)};
      }
    );

    const checkpointIndex =
      checkpointProgressService.getMostRecentlyReachedCheckpointIndex();

    expect(playerTranscriptService.getNumCards).toHaveBeenCalled();
    expect(playerTranscriptService.getCard).toHaveBeenCalledTimes(4);
    expect(
      explorationEngineService.getStateFromStateName
    ).toHaveBeenCalledTimes(4);
    expect(checkpointIndex).toBe(2);
  });

  it('should return correct checkpoint count when checkpoints exist', () => {
    const mockStates = [
      {name: 'Introduction', cardIsCheckpoint: false},
      {name: 'Checkpoint1', cardIsCheckpoint: true},
      {name: 'MiddleState', cardIsCheckpoint: false},
      {name: 'Checkpoint2', cardIsCheckpoint: true},
    ];

    spyOn(explorationEngineService, 'getExploration').and.returnValue({
      states: {
        getStates: () => mockStates,
      },
    });

    const count = checkpointProgressService.fetchCheckpointCount();
    expect(count).toBe(2);
  });

  it('should return zero when no checkpoints exist', () => {
    const mockStates = [
      {name: 'Introduction', cardIsCheckpoint: false},
      {name: 'MiddleState', cardIsCheckpoint: false},
    ];

    spyOn(explorationEngineService, 'getExploration').and.returnValue({
      states: {
        getStates: () => mockStates,
      },
    });

    const count = checkpointProgressService.fetchCheckpointCount();
    expect(count).toBe(0);
  });

  it('should count all states with cardIsCheckpoint true', () => {
    const mockStates = [
      {name: 'Checkpoint1', cardIsCheckpoint: true},
      {name: 'Checkpoint2', cardIsCheckpoint: true},
      {name: 'Checkpoint3', cardIsCheckpoint: true},
    ];

    spyOn(explorationEngineService, 'getExploration').and.returnValue({
      states: {
        getStates: () => mockStates,
      },
    });

    const count = checkpointProgressService.fetchCheckpointCount();
    expect(count).toBe(3);
  });

  it('should return sorted checkpoint indexes from getCheckpointStates', () => {
    const mockDepthGraph = {
      Introduction: 0,
      Checkpoint1: 1,
      MiddleState: 2,
      Checkpoint2: 3,
    };
    const mockStates = [
      {name: 'Introduction', cardIsCheckpoint: false},
      {name: 'Checkpoint1', cardIsCheckpoint: true},
      {name: 'MiddleState', cardIsCheckpoint: false},
      {name: 'Checkpoint2', cardIsCheckpoint: true},
    ];

    spyOn(explorationEngineService, 'extractDepthGraph').and.returnValue(
      mockDepthGraph
    );
    spyOn(explorationEngineService, 'getExploration').and.returnValue({
      states: {
        getStates: () => mockStates,
      },
    });

    const checkpointIndexes = checkpointProgressService.getCheckpointStates();

    expect(checkpointIndexes).toEqual([1, 3]);
    expect(checkpointIndexes).toEqual(
      checkpointIndexes.slice().sort((a, b) => a - b)
    );
  });

  it('should return empty array if no checkpoints exist in getCheckpointStates', () => {
    const mockDepthGraph = {
      Introduction: 0,
      MiddleState: 1,
    };
    const mockStates = [
      {name: 'Introduction', cardIsCheckpoint: false},
      {name: 'MiddleState', cardIsCheckpoint: false},
    ];

    spyOn(explorationEngineService, 'extractDepthGraph').and.returnValue(
      mockDepthGraph
    );
    spyOn(explorationEngineService, 'getExploration').and.returnValue({
      states: {
        getStates: () => mockStates,
      },
    });

    const checkpointIndexes = checkpointProgressService.getCheckpointStates();

    expect(checkpointIndexes).toEqual([]);
  });

  it('should ignore states with null name in getCheckpointStates', () => {
    const mockDepthGraph = {
      Checkpoint1: 1,
      Checkpoint2: 3,
    };
    const mockStates = [
      {name: null, cardIsCheckpoint: true},
      {name: 'Checkpoint1', cardIsCheckpoint: true},
      {name: 'Checkpoint2', cardIsCheckpoint: true},
    ];

    spyOn(explorationEngineService, 'extractDepthGraph').and.returnValue(
      mockDepthGraph
    );
    spyOn(explorationEngineService, 'getExploration').and.returnValue({
      states: {
        getStates: () => mockStates,
      },
    });

    const checkpointIndexes = checkpointProgressService.getCheckpointStates();

    expect(checkpointIndexes).toEqual([1, 3]);
  });

  it('should get most recently reached checkpoint index with no checkpoints', () => {
    const mockCards = [
      {getStateName: () => 'Introduction'},
      {getStateName: () => 'MiddleState'},
    ];

    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(2);
    spyOn(playerTranscriptService, 'getCard').and.callFake((index: number) => {
      return mockCards[index];
    });
    spyOn(explorationEngineService, 'getStateFromStateName').and.returnValue({
      cardIsCheckpoint: false,
    });

    const checkpointIndex =
      checkpointProgressService.getMostRecentlyReachedCheckpointIndex();

    expect(checkpointIndex).toBe(0);
  });

  it('should throw an error when setting a null checkpoint', () => {
    expect(() => {
      checkpointProgressService.setMostRecentlyReachedCheckpoint(null);
    }).toThrowError('Checkpoint state name cannot be null.');
  });

  it('should throw an error when checking if a null checkpoint is visited', () => {
    expect(() => {
      checkpointProgressService.checkIfCheckpointIsVisited(null);
    }).toThrowError('Checkpoint state name cannot be null.');
  });

  it('should set and get most recently reached checkpoint correctly', () => {
    const checkpointStateName = 'checkpoint_1';
    checkpointProgressService.setMostRecentlyReachedCheckpoint(
      checkpointStateName
    );
    expect(checkpointProgressService.getMostRecentlyReachedCheckpoint()).toBe(
      checkpointStateName
    );
  });

  it('should throw error if most recently reached checkpoint is not set', () => {
    expect(() =>
      checkpointProgressService.getMostRecentlyReachedCheckpoint()
    ).toThrowError('Last completed checkpoint is not set.');
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

  it('should set visited checkpoint state names correctly', () => {
    const checkpointStateName = 'checkpoint1';

    checkpointProgressService.setVisitedCheckpointStateNames(
      checkpointStateName
    );

    expect(checkpointProgressService.visitedCheckpointStateNames).toContain(
      checkpointStateName
    );
    expect(checkpointProgressService.visitedCheckpointStateNames.length).toBe(
      1
    );
  });

  it('should not add duplicate checkpoint state names', () => {
    const checkpointStateName = 'checkpoint1';

    checkpointProgressService.setVisitedCheckpointStateNames(
      checkpointStateName
    );
    checkpointProgressService.setVisitedCheckpointStateNames(
      checkpointStateName
    );

    expect(checkpointProgressService.visitedCheckpointStateNames.length).toBe(
      1
    );
    expect(checkpointProgressService.visitedCheckpointStateNames).toEqual([
      checkpointStateName,
    ]);
  });

  it('should reset visited checkpoint state names correctly', () => {
    const checkpointStateNames = ['checkpoint1', 'checkpoint2'];
    checkpointProgressService.visitedCheckpointStateNames =
      checkpointStateNames;

    checkpointProgressService.resetVisitedCheckpointStateNames();

    expect(checkpointProgressService.visitedCheckpointStateNames).toEqual([]);
  });

  it('should check if checkpoint is visited correctly when checkpoint is visited', () => {
    const checkpointStateName = 'checkpoint1';
    checkpointProgressService.visitedCheckpointStateNames = [
      checkpointStateName,
      'checkpoint2',
    ];

    const result =
      checkpointProgressService.checkIfCheckpointIsVisited(checkpointStateName);

    expect(result).toBe(true);
  });

  it('should check if checkpoint is visited correctly when checkpoint is not visited', () => {
    const checkpointStateName = 'checkpoint3';
    checkpointProgressService.visitedCheckpointStateNames = [
      'checkpoint1',
      'checkpoint2',
    ];

    const result =
      checkpointProgressService.checkIfCheckpointIsVisited(checkpointStateName);

    expect(result).toBe(false);
  });
});
