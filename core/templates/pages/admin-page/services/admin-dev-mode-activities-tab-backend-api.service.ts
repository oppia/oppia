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
import { downgradeInjectable } from '@angular/upgrade/static';

import { AdminPageConstants } from 'pages/admin-page/admin-page.constants';

@Injectable({
  providedIn: 'root'
})
export class AdminDevModeActivitiesTabBackendApiService {
  constructor(
    private httpClient: HttpClient
  ) {}
  private _reloadExploration(explorationId: string): Promise<Object> {
    return this.httpClient.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'reload exploration',
      exploration_id: explorationId
    }).toPromise();
  }
  private _generateDummyExplorations(
      numDummyExpsToGenerate: number, numDummyExpsToPublish: number):
    Promise<Object> {
    return this.httpClient.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_explorations',
      num_dummy_exps_to_generate: numDummyExpsToGenerate,
      num_dummy_exps_to_publish: numDummyExpsToPublish
    }).toPromise();
  }
  private _generateDummyStructures(): Promise<Object> {
    return this.httpClient.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_new_structures_data'
    }).toPromise();
  }
  private _generateDummySkillData(): Promise<Object> {
    return this.httpClient.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_new_skill_data'
    }).toPromise();
  }
  private _reloadCollection(collectionId: string): Promise<Object> {
    return this.httpClient.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'reload_collection',
      collection_id: String(collectionId)
    }).toPromise();
  }
  reloadExploration(explorationId: string): Promise<Object> {
    return this._reloadExploration(explorationId);
  }
  generateDummyExplorations(
      numDummyExpsToGenerate: number, numDummyExpsToPublish: number):
    Promise<Object> {
    return this._generateDummyExplorations(
      numDummyExpsToGenerate, numDummyExpsToPublish);
  }
  generateDummyStructures(): Promise<Object> {
    return this._generateDummyStructures();
  }
  generateDummySkillData(): Promise<Object> {
    return this._generateDummySkillData();
  }
  reloadCollection(collectionId: string): Promise<Object> {
    return this._reloadCollection(collectionId);
  }
}
angular.module('oppia').factory('AdminDevModeActivitiesTabBackendApiService',
  downgradeInjectable(AdminDevModeActivitiesTabBackendApiService));
