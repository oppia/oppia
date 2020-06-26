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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ContextService } from 'services/context.service';
import { ExplorationStatsBackendApiService } from
  'services/exploration-stats-backend-api.service';
import { ExplorationStatsObjectFactory } from
  'domain/statistics/ExplorationStatsObjectFactory';
import { ExplorationStatsService } from 'services/exploration-stats.service';

describe('Exploration stats service', function() {
  let contextService: ContextService;
  let explorationStatsBackendApiService: ExplorationStatsBackendApiService;
  let explorationStatsObjectFactory: ExplorationStatsObjectFactory;
  let explorationStatsService: ExplorationStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});

    contextService = TestBed.get(ContextService);
    explorationStatsBackendApiService = (
      TestBed.get(ExplorationStatsBackendApiService));
    explorationStatsObjectFactory = TestBed.get(ExplorationStatsObjectFactory);
    explorationStatsService = TestBed.get(ExplorationStatsService);
  });

  beforeEach(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('eid');

    this.explorationStats = (
      explorationStatsObjectFactory.createFromBackendDict({
        exp_id: 'eid',
        exp_version: 1,
        num_starts: 2,
        num_actual_starts: 20,
        num_completions: 200,
        state_stats_mapping: {},
      }));
  });

  it('should callout to backend api service for stats', fakeAsync(() => {
    spyOn(explorationStatsBackendApiService, 'fetchExplorationStats')
      .and.returnValue(Promise.resolve(this.explorationStats));

    const onSuccess = jasmine.createSpy('onSuccess');
    const onFailure = jasmine.createSpy('onFailure');

    explorationStatsService.getExplorationStats().then(onSuccess, onFailure);
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith(this.explorationStats);
    expect(onFailure).not.toHaveBeenCalled();
  }));

  it('should cache results after the first call', fakeAsync(() => {
    const backendApiSpy = (
      spyOn(explorationStatsBackendApiService, 'fetchExplorationStats')
        .and.returnValue(Promise.resolve(this.explorationStats)));

    const onSuccess = jasmine.createSpy('onSuccess');
    const onFailure = jasmine.createSpy('onFailure');

    explorationStatsService.getExplorationStats().then(onSuccess, onFailure);
    explorationStatsService.getExplorationStats().then(onSuccess, onFailure);
    explorationStatsService.getExplorationStats().then(onSuccess, onFailure);
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith(this.explorationStats);
    expect(onSuccess).toHaveBeenCalledTimes(3);
    expect(onFailure).not.toHaveBeenCalled();
    expect(backendApiSpy).toHaveBeenCalledTimes(1);
  }));
});
