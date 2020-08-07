// Copyright 2014 The Oppia Authors. All Rights Reserved.
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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { EditableExplorationBackendApiService } from
  'domain/exploration/editable-exploration-backend-api.service';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { LocalStorageService } from 'services/local-storage.service';
import { LoggerService } from 'services/contextual/logger.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';

require('services/services.constants.ajs.ts');

@Injectable({
  providedIn: 'root'
})
export class ExplorationDataService {
  // The pathname (without the hash) should be: .../create/{exploration_id}
  private explorationId: string;
  private draftChangeListId: number;
  private pathname: string = this.urlService.getPathname();
  private pathnameArray: string[];
  private resolvedAnswersUrlPrefix: string;
  private explorationDraftAutosaveUrl: string;
  private data: object;

  constructor(
    private alertsService: AlertsService,
    private editableExplorationBackendApiService:
    EditableExplorationBackendApiService,
    private http: HttpClient,
    private loggerService: LoggerService,
    private localStorageService: LocalStorageService,
    private readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService,
    private urlService: UrlService,
    private windowRef: WindowRef) {
    this.draftChangeListId = null;
    this.pathname = urlService.getPathname();
    this.pathnameArray = this.pathname.split('/');

    // Put exploration variables here.
    this.explorationId = '';
    this.data = null;

    for (var i = 0; i < this.pathnameArray.length; i++) {
      if (this.pathnameArray[i] === 'create') {
        this.explorationId = this.pathnameArray[i + 1];
        break;
      }
    }

    if (!this.explorationId) {
      loggerService.error(
        'Unexpected call to ExplorationDataService for pathname ' +
        this.pathname);
      // Note: if we do not return anything, Karma unit tests fail.
      throw {};
    } else {
      this.resolvedAnswersUrlPrefix = (
        '/createhandler/resolved_answers/' + this.explorationId);
      this.explorationDraftAutosaveUrl = (
        '/createhandler/autosave_draft/' + this.explorationId);
    }
  }

  // Note that the changeList is the full changeList since the last
  // committed version (as opposed to the most recent autosave).
  autosaveChangeList(
      changeList,
      successCallback,
      errorCallback = () => {}): void {
    // First save locally to be retrieved later if save is unsuccessful.
    this.localStorageService.saveExplorationDraft(
      this.explorationId, changeList, this.draftChangeListId);
    this.http.put(this.explorationDraftAutosaveUrl, {
      change_list: changeList,
      version: this.data['version']
    }).toPromise().then((response) => {
      this.draftChangeListId = response['body'].draft_change_list_id;
      // We can safely remove the locally saved draft copy if it was saved
      // to the backend.
      this.localStorageService.removeExplorationDraft(this.explorationId);
      if (successCallback) {
        successCallback(response);
      }
    }, () => {
      if (errorCallback) {
        errorCallback();
      }
    });
  }

  discardDraft(successCallback, errorCallback): void {
    this.http.post(this.explorationDraftAutosaveUrl, {}).toPromise().then(
      () => {
        this.localStorageService.removeExplorationDraft(this.explorationId);
        if (successCallback) {
          successCallback();
        }
      }, () => {
        if (errorCallback) {
          errorCallback();
        }
      });
  }

  // Returns a promise that supplies the data for the current exploration.
  getData(errorCallback): Promise<Object> {
    if (this.data) {
      this.loggerService.info('Found exploration data in cache.');
      return new Promise((resolve, reject) => {
        resolve(this.data);
      });
    } else {
      // Retrieve data from the server.
      // WARNING: Note that this is a version of the exploration with draft
      // changes applied. This makes a force-refresh necessary when changes
      // are discarded, otherwise the exploration-with-draft-changes
      // (which is cached here) will be reused.
      return (
        this.editableExplorationBackendApiService.fetchApplyDraftExploration(
          this.explorationId).then((response) => {
          this.loggerService.info('Retrieved exploration data.');
          this.loggerService.info(response);
          this.draftChangeListId = response.draft_change_list_id;
          this.data = response;
          var draft = this.localStorageService.getExplorationDraft(
            this.explorationId);
          if (draft) {
            if (draft.isValid(this.draftChangeListId)) {
              var changeList = draft.getChanges();
              this.autosaveChangeList(changeList, () => {
                // A reload is needed so that the changelist just saved is
                // loaded as opposed to the exploration returned by this
                // response.
                this.windowRef.nativeWindow.location.reload();
              });
            } else {
              if (errorCallback) {
                errorCallback(this.explorationId, draft.getChanges());
              }
            }
          }
          return response;
        })['catch']((error) => {
          errorCallback(error);
        })
      );
    }
  }

  // Returns a promise supplying the last saved version for the current
  // exploration.
  getLastSavedData() {
    return this.readOnlyExplorationBackendApiService.loadLatestExploration(
      this.explorationId).then((response) => {
      this.loggerService.info('Retrieved saved exploration data.');
      this.loggerService.info(response);

      return response.exploration;
    });
  }

  resolveAnswers(stateName, resolvedAnswersList) {
    this.alertsService.clearWarnings();
    this.http.put(
      this.resolvedAnswersUrlPrefix + '/' + encodeURIComponent(stateName), {
        resolved_answers: resolvedAnswersList
      }
    );
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
      changeList,
      commitMessage,
      successCallback,
      errorCallback): void {
    this.editableExplorationBackendApiService.updateExploration(
      this.explorationId, this.data ? this.data['version'] : null,
      commitMessage, changeList).then(
      (response) => {
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
