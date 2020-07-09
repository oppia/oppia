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
  IExplorationTaskBackendDict,
  ExplorationTask,
  ExplorationTaskObjectFactory
} from 'domain/improvements/ExplorationTaskObjectFactory';
import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

export interface IExplorationImprovementsResponseBackendDict {
  'open_tasks': IExplorationTaskBackendDict[];
  'resolved_task_types_by_state_name': {
    [stateName: string]: string[];
  };
}

export interface IExplorationImprovementsHistoryResponseBackendDict {
  'results': IExplorationTaskBackendDict[];
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
      private explorationTaskObjectFactory: ExplorationTaskObjectFactory,
      private http: HttpClient,
      private urlInterpolationService: UrlInterpolationService) {}

  async getTasksAsync(expId: string): Promise<ExplorationImprovementsResponse> {
    const explorationImprovementsUrl = (
      this.urlInterpolationService.interpolateUrl(
        ImprovementsConstants.EXPLORATION_IMPROVEMENTS_URL, {
          exploration_id: expId
        }));
    return this.http.get<IExplorationImprovementsResponseBackendDict>(
      explorationImprovementsUrl
    ).toPromise().then(
      backendDict => new ExplorationImprovementsResponse(
        backendDict.open_tasks.map(
          d => this.explorationTaskObjectFactory.createFromBackendDict(d)),
        new Map(Object.entries(backendDict.resolved_task_types_by_state_name)))
    );
  }

  async postTasksAsync(expId: string, tasks: ExplorationTask[]): Promise<void> {
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
    return this.http.get<IExplorationImprovementsHistoryResponseBackendDict>(
      explorationImprovementsHistoryUrl, {params}
    ).toPromise().then(
      backendDict => new ExplorationImprovementsHistoryResponse(
        backendDict.results.map(
          d => this.explorationTaskObjectFactory.createFromBackendDict(d)),
        backendDict.cursor,
        backendDict.more));
  }
}

angular.module('oppia').factory(
  'ExplorationImprovementsBackendApiService',
  downgradeInjectable(ExplorationImprovementsBackendApiService));
