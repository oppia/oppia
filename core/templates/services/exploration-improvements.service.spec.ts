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

import { ExplorationPermissions } from
  'domain/exploration/exploration-permissions-object.factory';
import { ExplorationImprovementsConfig } from
  'domain/improvements/exploration-improvements-config-object.factory';
import { UserExplorationPermissionsService } from
  'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { ContextService } from 'services/context.service';
import { ExplorationImprovementsBackendApiService } from
  'services/exploration-improvements-backend-api.service';

/**
 * @fileoverview Tests for ExplorationImprovementsService.
 */

describe('ExplorationImprovementsService', function() {
  let explorationImprovementsService;

  let contextService: ContextService;
  let explorationImprovementsBackendApiService:
    ExplorationImprovementsBackendApiService;
  let userExplorationPermissionsService: UserExplorationPermissionsService;

  const expId = 'eid';
  const newExpImprovementsConfig = (improvementsTabIsEnabled: boolean) => {
    return new ExplorationImprovementsConfig(
      expId, 1, improvementsTabIsEnabled, 0.25, 0.20, 100);
  };
  const newExpPermissions = (canEdit: boolean) => {
    return (
      new ExplorationPermissions(null, null, null, null, null, null, canEdit));
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject($injector => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});

    contextService = $injector.get('ContextService');
    explorationImprovementsBackendApiService = (
      $injector.get('ExplorationImprovementsBackendApiService'));
    explorationImprovementsService = (
      $injector.get('ExplorationImprovementsService'));
    userExplorationPermissionsService = (
      $injector.get('UserExplorationPermissionsService'));
  }));

  beforeEach(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('eid');
  });

  it('should enable improvements tab based on backend response',
    fakeAsync(async() => {
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve(newExpPermissions(true)));
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(newExpImprovementsConfig(true)));

      explorationImprovementsService.initAsync();
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeTrue();
    }));

  it('should disable improvements tab based on backend response',
    fakeAsync(async() => {
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve(newExpPermissions(true)));
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(newExpImprovementsConfig(false)));

      explorationImprovementsService.initAsync();
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeFalse();
    }));

  it('should disable improvements tab for non-editors when config gives false',
    fakeAsync(async() => {
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve(newExpPermissions(false)));
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(newExpImprovementsConfig(false)));

      explorationImprovementsService.initAsync();
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeFalse();
    }));

  it('should disable improvements tab for non-editors when config gives true',
    fakeAsync(async() => {
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve(newExpPermissions(false)));
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(newExpImprovementsConfig(true)));

      explorationImprovementsService.initAsync();
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeFalse();
    }));

  it('should propagate errors from the backend', fakeAsync(async() => {
    const error = new Error('Whoops!');
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
      .and.throwError(error);

    const onSuccess = jasmine.createSpy('onSuccess');
    const onFailure = jasmine.createSpy('onFailure', reason => {
      expect(reason).toBe(error);
    });

    const promise = explorationImprovementsService.initAsync()
      .then(onSuccess, onFailure);
    flushMicrotasks();
    await promise;
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalled();
  }));
});
