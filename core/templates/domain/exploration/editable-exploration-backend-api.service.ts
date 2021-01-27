// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to send changes to a exploration to the backend.
 */

import { HttpClient } from '@angular/common/http';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AppConstants } from 'app.constants';
import { ExplorationBackendDict } from './ExplorationObjectFactory';
import { ExplorationChange } from './exploration-draft.model';
import { tap } from 'rxjs/operators';
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EditableExplorationBackendApiService {
  constructor(
    private httpClient: HttpClient,
    private readOnlyExplorationBackendApiService:
      ReadOnlyExplorationBackendApiService,
    private urlInterpolationService: UrlInterpolationService) {}
  private _fetchExploration(
      explorationId: string,
      applyDraft: boolean): Promise<ExplorationBackendDict> {
    return this.httpClient.get<ExplorationBackendDict>(
      this._getExplorationUrl(explorationId, applyDraft)).toPromise();
  }

  private _updateExploration(
      explorationId: string,
      explorationVersion: string,
      commitMessage: string,
      changeList: ExplorationChange[]): Promise<ExplorationBackendDict> {
    const putData = {
      version: explorationVersion,
      commit_message: commitMessage,
      change_list: changeList
    };

    return this.httpClient.put<ExplorationBackendDict>(
      this._getExplorationUrl(explorationId, false), putData).pipe(tap(
      // Delete from the ReadOnlyExplorationBackendApiService's cache
      // As the two versions of the data (learner and editor) now differ.
      _ => this.readOnlyExplorationBackendApiService.deleteExplorationFromCache(
        explorationId)
    )).toPromise();
  }

  private _deleteExploration(explorationId: string): Promise<void> {
    return this.httpClient['delete']<void>(
      this._getExplorationUrl(explorationId, false)).pipe(tap(
      // Delete item from the ReadOnlyExplorationBackendApiService's cache.
      _ => this.readOnlyExplorationBackendApiService.deleteExplorationFromCache(
        explorationId)
    )).toPromise();
  }

  private _getExplorationUrl(
      explorationId: string, applyDraft: boolean): string {
    if (applyDraft) {
      return this.urlInterpolationService.interpolateUrl(
        AppConstants.EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE, {
          exploration_id: explorationId,
          apply_draft: JSON.stringify(applyDraft)
        }
      );
    }
    return this.urlInterpolationService.interpolateUrl(
      AppConstants.EDITABLE_EXPLORATION_DATA_URL_TEMPLATE, {
        exploration_id: explorationId
      }
    );
  }

  fetchExploration(explorationId: string):Promise<ExplorationBackendDict> {
    return this._fetchExploration(explorationId, false);
  }

  fetchApplyDraftExploration(
      explorationId: string): Promise<ExplorationBackendDict> {
    return this._fetchExploration(explorationId, true);
  }

  /**
   * Updates an exploration in the backend with the provided exploration
   * ID. The changes only apply to the exploration of the given version
   * and the request to update the exploration will fail if the provided
   * exploration version is older than the current version stored in the
   * backend. Both the changes and the message to associate with those
   * changes are used to commit a change to the exploration.
   * The new exploration is passed to the success callback,
   * if one is provided to the returned promise object. Errors are passed
   * to the error callback, if one is provided. Please note, once this is
   * called the cached exploration in ReadOnlyExplorationBackendApiService
   * will be deleted. This is due to the differences in the back-end
   * editor object and the back-end player object. As it stands now,
   * we are unable to cache any Exploration object obtained from the
   * editor beackend.
   */
  updateExploration(
      explorationId: string,
      explorationVersion: string,
      commitMessage: string,
      changeList: ExplorationChange[]): Promise<ExplorationBackendDict> {
    return this._updateExploration(
      explorationId, explorationVersion, commitMessage, changeList);
  }

  /**
   * Deletes an exploration in the backend with the provided exploration
   * ID. If successful, the exploration will also be deleted from the
   * ReadOnlyExplorationBackendApiService cache as well.
   * Errors are passed to the error callback, if one is provided.
   */
  deleteExploration(explorationId: string): Promise<void> {
    return this._deleteExploration(explorationId);
  }
}

angular.module('oppia').factory(
  'EditableExplorationBackendApiService', downgradeInjectable(
    EditableExplorationBackendApiService));
