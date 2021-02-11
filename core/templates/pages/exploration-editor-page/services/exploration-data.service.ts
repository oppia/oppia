// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for handling all interactions
 * with the exploration editor backend.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { EditableExplorationBackendApiService } from 'domain/exploration/editable-exploration-backend-api.service';
import { ExplorationChange } from 'domain/exploration/exploration-draft.model';
import { ExplorationBackendDict } from 'domain/exploration/ExplorationObjectFactory';
import { ReadOnlyExplorationBackendApiService, ReadOnlyExplorationBackendDict } from 'domain/exploration/read-only-exploration-backend-api.service';
import { tap } from 'rxjs/operators';
import { AlertsService } from 'services/alerts.service';
import { LoggerService } from 'services/contextual/logger.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { LocalStorageService } from 'services/local-storage.service';
import { ExplorationDataBackendApiService } from './exploration-data-backend-api.service';

export interface DraftAutoSaveResponse {
  'draft_change_list_id': number;
  'is_version_of_draft_valid': boolean;
}
@Injectable({
  providedIn: 'root'
})
export class ExplorationDataService {
  draftChangeListId: number | null = null;
  explorationDraftAutosaveUrl: string;
  explorationId: string;
  resolvedAnswersUrlPrefix: string;
  data: ExplorationBackendDict;

  constructor(
    private alertsService: AlertsService,
    private editableExplorationBackendApiService:
      EditableExplorationBackendApiService,
    private explorationDataBackendApiService: ExplorationDataBackendApiService,
    private localStorageService:LocalStorageService,
    private loggerService: LoggerService,
    private readOnlyExplorationBackendApiService:
      ReadOnlyExplorationBackendApiService,
    private urlService: UrlService,
    private windowRef: WindowRef
  ) {
    let explorationId = '';
    // The pathname (without the hash) should be: .../create/{exploration_id}.
    const pathname = this.urlService.getPathname();
    const pathnameArray = pathname.split('/');
    for (let i = 0; i < pathnameArray.length; i++) {
      if (pathnameArray[i] === 'create') {
        explorationId = pathnameArray[i + 1];
        break;
      }
    }

    if (!explorationId) {
      this.loggerService.error(
        'Unexpected call to ExplorationDataService for pathname: ' + pathname);
      this.autosaveChangeList = undefined;
      this.discardDraft = undefined;
      this.getData = undefined;
      this.getLastSavedData = undefined;
      this.save = undefined;
    } else {
      this.explorationId = explorationId;
      this.resolvedAnswersUrlPrefix = (
        '/createhandler/resolved_answers/' + explorationId);
      this.explorationDraftAutosaveUrl = (
        '/createhandler/autosave_draft/' + explorationId);
    }
  }

  private _autosaveChangeList(
      changeList: ExplorationChange[]): Promise<DraftAutoSaveResponse> {
    this.localStorageService.saveExplorationDraft(
      this.explorationId, changeList, this.draftChangeListId);
    return this.explorationDataBackendApiService.saveChangeList(
      this.explorationDraftAutosaveUrl,
      changeList,
      this.data.version,
    ).pipe(
      tap(response => {
        this.draftChangeListId = response.draft_change_list_id;
        // We can safely remove the locally saved draft copy if it was saved
        // to the backend.
        this.localStorageService.removeExplorationDraft(this.explorationId);
      })).toPromise();
  }

  // Note that the changeList is the full changeList since the last
  // committed version (as opposed to the most recent autosave).
  autosaveChangeList(
      changeList: ExplorationChange[],
      successCallback: (response: DraftAutoSaveResponse) => void,
      errorCallback = () => {}
  ): Promise<void> {
    return this._autosaveChangeList(changeList).then(
      (response) => {
        if (successCallback) {
          successCallback(response);
        }
      },
      () => {
        if (errorCallback) {
          errorCallback();
        }
      }
    );
  }

  discardDraft(): Promise<void> {
    return this.explorationDataBackendApiService.discardDraft(
      this.explorationDraftAutosaveUrl).toPromise();
  }

  getData(errorCallback: (
    explorationId: string,
    lostChanges: ExplorationChange[]) => void | undefined
  ): Promise<ExplorationBackendDict> {
    if (this.data) {
      this.loggerService.info('Found exploration data in cache.');
      return Promise.resolve(this.data);
    } else {
      // Retrieve data from the server.
      // WARNING: Note that this is a version of the exploration with draft
      // changes applied. This makes a force-refresh necessary when changes
      // are discarded, otherwise the exploration-with-draft-changes
      // (which is cached here) will be reused.
      return new Promise((resolve, reject) => {
        this.editableExplorationBackendApiService.fetchApplyDraftExploration(
          this.explorationId).then((response) => {
          this.loggerService.info('Retrieved exploration data.');
          this.loggerService.info(JSON.stringify(response));
          this.draftChangeListId = response.draft_change_list_id;
          this.data = response;
          const draft = this.localStorageService.getExplorationDraft(
            this.explorationId);
          if (draft) {
            if (draft.isValid(this.draftChangeListId)) {
              var changeList = draft.getChanges();
              this._autosaveChangeList(changeList).then(
                // A reload is needed so that the changelist just saved is
                // loaded as opposed to the exploration returned by this
                // response.
                () => {
                  this.windowRef.nativeWindow.location.reload();
                },
                // If the request errors out, do nothing.
                () => {}
              );
            } else {
              if (errorCallback) {
                errorCallback(this.explorationId, draft.getChanges());
              }
            }
          }
          resolve(response);
        });
      });
    }
  }

  // Returns a promise supplying the last saved version for the current
  // exploration.
  getLastSavedData(): Promise<ReadOnlyExplorationBackendDict> {
    return this.readOnlyExplorationBackendApiService.loadLatestExploration(
      this.explorationId).then(response => {
      this.loggerService.info('Retrieved saved exploration data.');
      this.loggerService.info(JSON.stringify(response));

      return response.exploration;
    });
  }
  /**
   * Saves the exploration to the backend, and, on a success callback,
   * updates the local copy of the exploration data.
   * @param {object} changeList - Represents the change list for
   *   this save. Each element of the list is a command representing an
   *   editing action (such as add state, delete state, etc.). See the
   *  _'Change' class in exp_services.py for full documentation.
   * @param {string} commitMessage - The user-entered commit message for
   *   this save operation.
   */
  save(
      changeList: ExplorationChange[],
      commitMessage: string,
      successCallback: (
        isDraftVersionvalid: boolean,
        draftChanges: ExplorationChange[]) => void,
      errorCallback: () => void): void {
    this.editableExplorationBackendApiService.updateExploration(
      this.explorationId,
    this.data ? this.data.version : null,
    commitMessage, changeList).then(
      response => {
        this.alertsService.clearWarnings();
        this.data = response;
        if (successCallback) {
          successCallback(
            response.is_version_of_draft_valid,
            response.draft_changes);
        }
      }, () => {
        if (errorCallback) {
          errorCallback();
        }
      }
    );
  }
}

angular.module('oppia').factory(
  'ExplorationDataService', downgradeInjectable(ExplorationDataService));
