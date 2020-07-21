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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import {
  ExplorationImprovementsBackendApiService,
  ExplorationImprovementsConfig,
} from 'services/exploration-improvements-backend-api.service';

/**
 * @fileoverview Tests for ExplorationImprovementsService.
 */

describe('ExplorationImprovementsService', function() {
  let explorationImprovementsBackendApiService:
    ExplorationImprovementsBackendApiService;
  let explorationImprovementsService;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject($injector => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});

    explorationImprovementsBackendApiService = $injector.get(
      'ExplorationImprovementsBackendApiService');
    explorationImprovementsService = $injector.get(
      'ExplorationImprovementsService');
  }));

  it('should enable improvements tab based on backend response',
    fakeAsync(async() => {
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(new ExplorationImprovementsConfig(
          true, 0, 0, 0)));

      explorationImprovementsService.initAsync('eid');
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeTrue();
    }));

  it('should disable improvements tab based on backend response',
    fakeAsync(async() => {
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(new ExplorationImprovementsConfig(
          false, 0, 0, 0)));

      explorationImprovementsService.initAsync('eid');
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeFalse();
    }));
});
