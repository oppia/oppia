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

import { ContextService } from 'services/context.service';
import {
  ExplorationImprovementsBackendApiService, ExplorationImprovementsResponse
} from 'services/exploration-improvements-backend-api.service';
import { ExplorationImprovementsConfig } from
  'domain/improvements/exploration-improvements-config-object.factory';
import { ExplorationImprovementsTaskRegistryService } from
  'services/exploration-improvements-task-registry.service';
import { ExplorationPermissions } from
  'domain/exploration/exploration-permissions-object.factory';
import { ExplorationStatsService } from
  'services/exploration-stats.service';
import { StateTopAnswersStatsService } from
  'services/state-top-answers-stats.service';
import { UserExplorationPermissionsService } from
  'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { ExplorationStats } from
  'domain/statistics/ExplorationStatsObjectFactory';

/**
 * @fileoverview Tests for ExplorationImprovementsService.
 */

describe('ExplorationImprovementsService', function() {
  let explorationImprovementsService;

  let explorationImprovementsTaskRegistryService:
    ExplorationImprovementsTaskRegistryService;
  let explorationStatesService;
  let explorationStatsService: ExplorationStatsService;
  let playthroughIssuesService;
  let stateTopAnswersStatsService: StateTopAnswersStatsService;
  let contextService: ContextService;
  let explorationImprovementsBackendApiService:
    ExplorationImprovementsBackendApiService;
  let explorationRightsService;
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
    explorationImprovementsTaskRegistryService = (
      $injector.get('ExplorationImprovementsTaskRegistryService'));
    explorationRightsService = $injector.get('ExplorationRightsService');
    explorationStatesService = $injector.get('ExplorationStatesService');
    explorationStatsService = $injector.get('ExplorationStatsService');
    playthroughIssuesService = $injector.get('PlaythroughIssuesService');
    stateTopAnswersStatsService = $injector.get('StateTopAnswersStatsService');
    userExplorationPermissionsService = (
      $injector.get('UserExplorationPermissionsService'));
  }));

  beforeEach(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('eid');
    spyOn(explorationImprovementsBackendApiService, 'getTasksAsync')
      .and.returnValue(Promise.resolve(
        new ExplorationImprovementsResponse([], new Map())));
    spyOn(explorationImprovementsTaskRegistryService, 'initialize');
    spyOn(explorationStatsService, 'getExplorationStats')
      .and.returnValue(Promise.resolve(
        new ExplorationStats('eid', 1, 0, 0, 0, new Map())));
    spyOn(playthroughIssuesService, 'getIssues')
      .and.returnValue(Promise.resolve());
    spyOn(playthroughIssuesService, 'initSession').and.stub();
    spyOn(stateTopAnswersStatsService, 'getTopAnswersByStateNameAsync')
      .and.returnValue(Promise.resolve(new Map()));
  });

  it('should enable improvements tab based on backend response',
    fakeAsync(async() => {
      spyOn(explorationRightsService, 'isPublic').and.returnValue(true);
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
      spyOn(explorationRightsService, 'isPublic').and.returnValue(true);
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

  it('should disable improvements tab for private explorations',
    fakeAsync(async() => {
      spyOn(explorationRightsService, 'isPublic').and.returnValue(false);
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve(newExpPermissions(true)));
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(newExpImprovementsConfig(true)));

      explorationImprovementsService.initAsync();
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeFalse();
    }));

  it('should disable improvements tab for non-editors when config gives false',
    fakeAsync(async() => {
      spyOn(explorationRightsService, 'isPublic').and.returnValue(true);
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
      spyOn(explorationRightsService, 'isPublic').and.returnValue(true);
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
