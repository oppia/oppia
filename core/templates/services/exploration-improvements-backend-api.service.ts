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
 * @fileoverview Service for fetching improvement tasks from the backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import {
  ExplorationImprovementsConfig,
  ExplorationImprovementsConfigBackendDict,
} from 'domain/improvements/exploration-improvements-config.model';
import {
  ExplorationTask,
  ExplorationTaskBackendDict,
  ExplorationTaskModel
} from 'domain/improvements/exploration-task.model';
import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

export interface ExplorationImprovementsResponseBackendDict {
  'open_tasks': ExplorationTaskBackendDict[];
  'resolved_task_types_by_state_name': {
    [stateName: string]: string[];
  };
}

export interface ExplorationImprovementsHistoryResponseBackendDict {
  'results': ExplorationTaskBackendDict[];
  'cursor': string;
  'more': boolean;
}

export class ExplorationImprovementsResponse {
  constructor(
      public readonly openTasks: ExplorationTask[],
      public readonly resolvedTaskTypesByStateName: Map<string, string[]>) {}
}

export class ExplorationImprovementsHistoryResponse {
  constructor(
      public readonly results: ExplorationTask[],
      public readonly cursor: string,
      public readonly more: boolean) {}
}

@Injectable({providedIn: 'root'})
export class ExplorationImprovementsBackendApiService {
  constructor(
      private http: HttpClient,
      private urlInterpolationService: UrlInterpolationService) {}

  async getTasksAsync(expId: string): Promise<ExplorationImprovementsResponse> {
    const explorationImprovementsUrl = (
      this.urlInterpolationService.interpolateUrl(
        ImprovementsConstants.EXPLORATION_IMPROVEMENTS_URL, {
          exploration_id: expId
        }));
    return this.http.get<ExplorationImprovementsResponseBackendDict>(
      explorationImprovementsUrl
    ).toPromise().then(
      backendDict => new ExplorationImprovementsResponse(
        backendDict.open_tasks.map(
          d => ExplorationTaskModel.createFromBackendDict(d)),
        new Map(Object.entries(backendDict.resolved_task_types_by_state_name)))
    );
  }

  async postTasksAsync(expId: string, tasks: ExplorationTask[]): Promise<void> {
    if (tasks.length === 0) {
      return;
    }
    const explorationImprovementsUrl = (
      this.urlInterpolationService.interpolateUrl(
        ImprovementsConstants.EXPLORATION_IMPROVEMENTS_URL, {
          exploration_id: expId
        }));
    return this.http.post<void>(explorationImprovementsUrl, {
      task_entries: tasks.map(t => t.toPayloadDict())
    }).toPromise();
  }

  async getHistoryPageAsync(
      expId: string,
      cursor?: string): Promise<ExplorationImprovementsHistoryResponse> {
    const explorationImprovementsHistoryUrl = (
      this.urlInterpolationService.interpolateUrl(
        ImprovementsConstants.EXPLORATION_IMPROVEMENTS_HISTORY_URL, {
          exploration_id: expId
        }));
    let params = new HttpParams();
    if (cursor) {
      params = params.append('cursor', cursor);
    }
    return this.http.get<ExplorationImprovementsHistoryResponseBackendDict>(
      explorationImprovementsHistoryUrl, {params}
    ).toPromise().then(
      backendDict => new ExplorationImprovementsHistoryResponse(
        backendDict.results.map(
          d => ExplorationTaskModel.createFromBackendDict(d)),
        backendDict.cursor,
        backendDict.more));
  }

  async getConfigAsync(
      expId: string): Promise<ExplorationImprovementsConfig> {
    const explorationImprovementsConfigUrl = (
      this.urlInterpolationService.interpolateUrl(
        ImprovementsConstants.EXPLORATION_IMPROVEMENTS_CONFIG_URL, {
          exploration_id: expId
        }));
    return this.http.get<ExplorationImprovementsConfigBackendDict>(
      explorationImprovementsConfigUrl
    ).toPromise().then(
      backendDict =>
        ExplorationImprovementsConfig.createFromBackendDict(
          backendDict));
  }
}

angular.module('oppia').factory(
  'ExplorationImprovementsBackendApiService',
  downgradeInjectable(ExplorationImprovementsBackendApiService));
