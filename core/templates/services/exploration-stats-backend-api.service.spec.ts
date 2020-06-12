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
 * @fileoverview TODO
 */

imporrt { HttpClientTestingModule, HttpTestingController }
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ExplorationStatsBackendApiService } from
  'services/exploration-stats-backend-api.service';
import { IStateStatsBackendDict, StateStats } from
  'domain/statistics/StateStatsObjectFactory';
import { IExplorationStatsBackendDict, ExplorationStats } from
  'domain/statistics/ExplorationStatsObjectFactory';

describe('Exploration stats backend api service', () => {
  let explorationStatsBackendApiService: ExplorationStatsBackendApiService;
  let httpTestingController: HttpTestingController;
  let expStatsBackendDict: IExplorationStatsBackendDict = {
    exp_id: 'eid',
    exp_version: 1,
    num_starts_v1: 10,
    num_starts_v2: 15,
    num_actual_starts_v1: 5,
    num_actual_starts_v2: 9,
    num_completions_v1: 3,
    num_completions_v2: 8,
    state_stats_mapping: {
      Introduction: <IStateStatsBackendDict>{
      },
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});

    explorationStatsBackendApiService = (
      TestBed.get(ExplorationStatsBackendApiService));
    httpTestingController = TestBed.get(HttpTestingController);
  });

  it('should return a fully formed object from backend dict', fakeAsync(() => {
    let onSuccess = jasmine.createSpy('success');
    let onFailure = jasmine.createSpy('failure');

    explorationStatsBackendApiService.fetchExplorationStats('eid')
      .then(onSuccess, onFailure);

    let req = httpTestingController.expectOne('/explorehandler/statistics/eid');
    expect(req.request.method).toEqual('GET');
    req.flush(expStatsBackendDict);
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith();
  }));
});
