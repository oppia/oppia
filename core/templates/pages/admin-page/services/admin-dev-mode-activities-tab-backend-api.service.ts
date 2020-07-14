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
 * @fileoverview Service to change admin-dev-mode-activities tab properties
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { downgradeInjectable } from '@angular/upgrade/static';

const constants = require('pages/admin-page/admin-page.constants');

@Injectable({
  providedIn: 'root'
})
export class AdminDevModeActivitiesTabBackendApiService {
  constructor(
    private httpClient: HttpClient
  ) {}
  private _reloadExploration(explorationId: string): Observable<Object> {
    return this.httpClient.post(constants.ADMIN_HANDLER_URL, {
      action: 'reload_exploration',
      exploration_id: String(explorationId)
    });
  }
  private _generateDummyExplorations(
      numDummyExpsToGenerate: number, numDummyExpsToPublish: number):
    Observable<Object> {
    return this.httpClient.post(constants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_explorations',
      num_dummy_exps_to_generate: numDummyExpsToGenerate,
      num_dummy_exps_to_publish: numDummyExpsToPublish
    });
  }
  private _generateDummyStructures(): Observable<Object> {
    return this.httpClient.post(constants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_new_structures_data'
    });
  }
  private _generateDummySkillData(): Observable<Object> {
    return this.httpClient.post(constants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_new_skill_data'
    });
  }
  private _reloadCollection(collectionId: string): Observable<Object> {
    return this.httpClient.post(constants.ADMIN_HANDLER_URL, {
      action: 'reload_collection',
      collection_id: String(collectionId)
    });
  }
  reloadExploration(explorationId: string): Observable<Object> {
    return this._reloadExploration(explorationId);
  }
  generateDummyExplorations(
      numDummyExpsToGenerate: number, numDummyExpsToPublish: number):
    Observable<Object> {
    return this._generateDummyExplorations(
      numDummyExpsToGenerate, numDummyExpsToPublish);
  }
  generateDummyStructures(): Observable<Object> {
    return this._generateDummyStructures();
  }
  generateDummySkillData(): Observable<Object> {
    return this._generateDummySkillData();
  }
  reloadCollection(collectionId: string): Observable<Object> {
    return this._reloadCollection(collectionId);
  }
}
angular.module('oppia').factory('AdminDevModeActivitiesTabBackendApiService',
  downgradeInjectable(AdminDevModeActivitiesTabBackendApiService));
