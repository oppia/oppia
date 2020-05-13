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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse }
  from '@angular/common/http';

import cloneDeep from 'lodash/cloneDeep';

import { AppConstants } from 'app.constants';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})

export class EditableExplorationBackendApiService {
  constructor(
    private http: HttpClient,
    private readOnlyExplorationBackendApiService:
      ReadOnlyExplorationBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
  ) { }

  private _fetchExploration(explorationId: string, applyDraft,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: HttpErrorResponse) => void): void {
    let editableExplorationDataUrl = this._getExplorationUrl(
      explorationId, applyDraft);
    this.http.get(editableExplorationDataUrl, { observe: 'response' })
      .toPromise().then((response: HttpResponse<any>) => {
        let exploration = cloneDeep(response.body);
        if (successCallback) {
          successCallback(exploration);
        }
      }, (errorResponse: HttpErrorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      });
  }

  private _updateExploration(
      explorationId, explorationVersion, commitMessage, changeList,
      successCallback, errorCallback) {
    let editableExplorationDataUrl = this._getExplorationUrl(
      explorationId, null);

    let putData = {
      version: explorationVersion,
      commit_message: commitMessage,
      change_list: changeList
    };
    this.http.put(editableExplorationDataUrl, putData).toPromise().then(
      (response: HttpResponse<any>) => {
        // The returned data is an updated exploration dict.
        let exploration = cloneDeep(response.body);

        // Delete from the ReadOnlyExplorationBackendApiService's cache
        // As the two versions of the data (learner and editor) now differ
        this.readOnlyExplorationBackendApiService.deleteExplorationFromCache(
          explorationId);

        if (successCallback) {
          successCallback(exploration);
        }
      }, (errorResponse: HttpErrorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      }
    );
  }

  private _deleteExploration(
      explorationId, successCallback, errorCallback) {
    let editableExplorationDataUrl = this._getExplorationUrl(
      explorationId, null);

    this.http['delete'](editableExplorationDataUrl).toPromise().then((r) => {
      // Delete item from the ReadOnlyExplorationBackendApiService's cache
      this.readOnlyExplorationBackendApiService.deleteExplorationFromCache(
        explorationId);
      if (successCallback) {
        successCallback(r);
      }
    }, (errorResponse: HttpErrorResponse) => {
      if (errorCallback) {
        errorCallback(errorResponse.error);
      }
    });
  }

  private _getExplorationUrl(explorationId: string, applyDraft): string {
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


  fetchExploration(explorationId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchExploration(explorationId, null, resolve, reject);
    });
  }

  fetchApplyDraftExploration(explorationId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchExploration(explorationId, true, resolve, reject);
    });
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
      explorationId, explorationVersion, commitMessage, changeList)
    : Promise<Object> {
    return new Promise((resolve, reject) => {
      this._updateExploration(
        explorationId, explorationVersion, commitMessage, changeList,
        resolve, reject);
    });
  }

  /**
   * Deletes an exploration in the backend with the provided exploration
   * ID. If successful, the exploration will also be deleted from the
   * ReadOnlyExplorationBackendApiService cache as well.
   * Errors are passed to the error callback, if one is provided.
   */
  deleteExploration(explorationId): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._deleteExploration(
        explorationId, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'EditableExplorationBackendApiService',
  downgradeInjectable(EditableExplorationBackendApiService));
