// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the ExplorationStatsService.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {ExplorationStatsBackendApiService} from 'services/exploration-stats-backend-api.service';
import {ExplorationStats} from 'domain/statistics/exploration-stats.model';
import {ExplorationStatsService} from 'services/exploration-stats.service';

describe('Exploration stats service', function () {
  let explorationStatsBackendApiService: ExplorationStatsBackendApiService;
  let explorationStatsService: ExplorationStatsService;
  let explorationStats: ExplorationStats;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});

    explorationStatsBackendApiService = TestBed.inject(
      ExplorationStatsBackendApiService
    );
    explorationStatsService = TestBed.inject(ExplorationStatsService);
  });

  beforeEach(() => {
    explorationStats = ExplorationStats.createFromBackendDict({
      exp_id: 'eid',
      exp_version: 1,
      num_starts: 2,
      num_actual_starts: 20,
      num_completions: 200,
      state_stats_mapping: {},
    });
  });

  it('should callout to backend api service for stats', fakeAsync(() => {
    spyOn(
      explorationStatsBackendApiService,
      'fetchExplorationStatsAsync'
    ).and.returnValue(Promise.resolve(explorationStats));

    const onSuccess = jasmine.createSpy('onSuccess');
    const onFailure = jasmine.createSpy('onFailure');

    explorationStatsService
      .getExplorationStatsAsync('eid')
      .then(onSuccess, onFailure);
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith(explorationStats);
    expect(onFailure).not.toHaveBeenCalled();
  }));

  it('should cache results after the first call', fakeAsync(() => {
    const backendApiSpy = spyOn(
      explorationStatsBackendApiService,
      'fetchExplorationStatsAsync'
    ).and.returnValue(Promise.resolve(explorationStats));

    const onSuccess = jasmine.createSpy('onSuccess');
    const onFailure = jasmine.createSpy('onFailure');

    explorationStatsService
      .getExplorationStatsAsync('eid')
      .then(onSuccess, onFailure);
    explorationStatsService
      .getExplorationStatsAsync('eid')
      .then(onSuccess, onFailure);
    explorationStatsService
      .getExplorationStatsAsync('eid')
      .then(onSuccess, onFailure);
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith(explorationStats);
    expect(onSuccess).toHaveBeenCalledTimes(3);
    expect(onFailure).not.toHaveBeenCalled();
    expect(backendApiSpy).toHaveBeenCalledTimes(1);
  }));
});
