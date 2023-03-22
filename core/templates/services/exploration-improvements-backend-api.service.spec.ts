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
 * @fileoverview Unit tests for the ExplorationImprovementsBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import {
  ExplorationImprovementsConfig,
  ExplorationImprovementsConfigBackendDict,
} from 'domain/improvements/exploration-improvements-config.model';
import {
  ExplorationTaskBackendDict,
  ExplorationTaskModel,
} from 'domain/improvements/exploration-task.model';
import {
  ExplorationImprovementsBackendApiService,
  ExplorationImprovementsHistoryResponse,
  ExplorationImprovementsHistoryResponseBackendDict,
  ExplorationImprovementsResponse,
  ExplorationImprovementsResponseBackendDict
} from 'services/exploration-improvements-backend-api.service';

describe('Exploration stats back-end API service', () => {
  let httpTestingController: HttpTestingController;
  let explorationImprovementsBackendApiService:
    ExplorationImprovementsBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});
    explorationImprovementsBackendApiService = (
      TestBed.get(ExplorationImprovementsBackendApiService));
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return an ExplorationImprovementsResponse', fakeAsync(async() => {
    const taskDict: ExplorationTaskBackendDict = {
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'resolved',
      resolver_username: 'test_user',
      resolved_on_msecs: 123456789,
    };

    const response = (
      explorationImprovementsBackendApiService.getTasksAsync('eid'));

    const req = (
      httpTestingController.expectOne('/improvements/exploration/eid'));
    expect(req.request.method).toEqual('GET');
    req.flush({
      open_tasks: [taskDict],
      resolved_task_types_by_state_name: {Introduction: ['high_bounce_rate']},
    } as ExplorationImprovementsResponseBackendDict);
    flushMicrotasks();

    expect(await response).toEqual(
      new ExplorationImprovementsResponse(
        [ExplorationTaskModel.createFromBackendDict(taskDict)],
        new Map([['Introduction', ['high_bounce_rate']]])));
  }));

  it('should return an ExplorationImprovementsHistoryResponse',
    fakeAsync(async() => {
      const taskDict: ExplorationTaskBackendDict = {
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'high_bounce_rate',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description: '20% of learners dropped at this state',
        status: 'resolved',
        resolver_username: 'test_user',
        resolved_on_msecs: 123456789,
      };

      const response = (
        explorationImprovementsBackendApiService.getHistoryPageAsync('eid'));

      const req = httpTestingController.expectOne(
        '/improvements/history/exploration/eid');
      expect(req.request.method).toEqual('GET');
      req.flush({
        results: [taskDict],
        cursor: 'cursor123',
        more: true,
      } as ExplorationImprovementsHistoryResponseBackendDict);
      flushMicrotasks();

      expect(await response).toEqual(
        new ExplorationImprovementsHistoryResponse(
          [ExplorationTaskModel.createFromBackendDict(taskDict)],
          'cursor123',
          true));
    }));

  it('should return an ExplorationImprovementsHistoryResponse when given a ' +
    'cursor', fakeAsync(async() => {
    const taskDict: ExplorationTaskBackendDict = {
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'resolved',
      resolver_username: 'test_user',
      resolved_on_msecs: 123456789,
    };

    const response = (
      explorationImprovementsBackendApiService.getHistoryPageAsync(
        'eid', 'cursor123'));

    const req = httpTestingController.expectOne(
      '/improvements/history/exploration/eid?cursor=cursor123');
    expect(req.request.method).toEqual('GET');
    req.flush({
      results: [taskDict],
      cursor: 'cursor456',
      more: false,
    } as ExplorationImprovementsHistoryResponseBackendDict);
    flushMicrotasks();

    expect(await response).toEqual(
      new ExplorationImprovementsHistoryResponse(
        [ExplorationTaskModel.createFromBackendDict(taskDict)],
        'cursor456',
        false));
  }));

  it('should try to post a task dict to the back-end', fakeAsync(async() => {
    const task = ExplorationTaskModel.createFromBackendDict({
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'resolved',
      resolver_username: 'test_user',
      resolved_on_msecs: 123456789,
    });

    const onSuccess = jasmine.createSpy('onSuccess');
    const onFailure = jasmine.createSpy('onFailure');
    explorationImprovementsBackendApiService.postTasksAsync('eid', [task])
      .then(onSuccess, onFailure);

    const req = (
      httpTestingController.expectOne('/improvements/exploration/eid'));
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      task_entries: [task.toPayloadDict()]
    });
    req.flush({});
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  }));

  it('should not make HTTP call when posting empty list', fakeAsync(async() => {
    const onSuccess = jasmine.createSpy('onSuccess');
    const onFailure = jasmine.createSpy('onFailure');
    explorationImprovementsBackendApiService.postTasksAsync('eid', [])
      .then(onSuccess, onFailure);

    httpTestingController.expectNone('/improvements/exploration/eid');
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  }));

  it('should return an ExplorationImprovementsConfig', fakeAsync(async() => {
    const response = (
      explorationImprovementsBackendApiService.getConfigAsync('eid'));

    const req = (
      httpTestingController.expectOne('/improvements/config/exploration/eid'));
    expect(req.request.method).toEqual('GET');
    req.flush({
      exploration_id: 'eid',
      exploration_version: 1,
      is_improvements_tab_enabled: true,
      high_bounce_rate_task_state_bounce_rate_creation_threshold: 0.25,
      high_bounce_rate_task_state_bounce_rate_obsoletion_threshold: 0.20,
      high_bounce_rate_task_minimum_exploration_starts: 100,
    } as ExplorationImprovementsConfigBackendDict);
    flushMicrotasks();

    expect(await response).toEqual(
      new ExplorationImprovementsConfig('eid', 1, true, 0.25, 0.20, 100));
  }));
});
