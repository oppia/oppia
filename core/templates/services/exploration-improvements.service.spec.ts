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

import { ExplorationImprovementsConfig } from
  'domain/improvements/exploration-improvements-config-object.factory';
import { ExplorationImprovementsBackendApiService } from
  'services/exploration-improvements-backend-api.service';

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
          'eid', 1, true, 0.25, 0.20, 100)));

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
          'eid', 1, false, 0.25, 0.20, 100)));

      explorationImprovementsService.initAsync('eid');
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeFalse();
    }));

  it('should propagate errors from the backend', fakeAsync(async() => {
    const error = new Error('Whoops!');
    spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
      .and.throwError(error);

    const onSuccess = jasmine.createSpy('onSuccess');
    const onFailure = jasmine.createSpy('onFailure', reason => {
      expect(reason).toBe(error);
    });

    const promise = explorationImprovementsService.initAsync('eid')
      .then(onSuccess, onFailure);
    flushMicrotasks();
    await promise;
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalled();
  }));
});
