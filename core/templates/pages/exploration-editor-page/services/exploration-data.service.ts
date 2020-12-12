/* eslint-disable oppia/no-multiline-disable */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service';
import { EditableExplorationBackendApiService } from
  'domain/exploration/editable-exploration-backend-api.service';
import { ReadOnlyExplorationBackendApiService, ReadOnlyExplorationBackendDict } from
  'domain/exploration/read-only-exploration-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { LoggerService } from 'services/contextual/logger.service';
import { LocalStorageService } from 'services/local-storage.service';
import { UrlService } from 'services/contextual/url.service';
import { ExplorationChangeList } from 'domain/exploration/exploration-draft.model';
import { ExplorationBackendDict } from 'domain/exploration/ExplorationObjectFactory';
import { ExplorationDataBackendApiService } from 'pages/exploration-editor-page/services/exploration-data-backend-api.service';

export interface ExplorationAutosaveChangeListResponse{
  'draft_change_list_id': number
}
export interface DraftExplorationResponse{
  'draft_change_list_id': number,
  'version': number,
  'exploration': ExplorationBackendDict
}
export interface ResolveAnswerResponse{
  'resolved_answers': string[]
}
export interface ExplorationAutosaveChangeListRequest{
    'change_list': ExplorationChangeList[],
    'version': number
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationDataService {
  resolvedAnswersUrlPrefix: string = null;
  explorationDraftAutosaveUrl: string= null;
  private draftChangeListId: number = null;
  private pathname: string;
  private pathnameArray: string[];
  private explorationData;
  private explorationId: string = null;

  constructor(
    private editableExplorationBackendApiService:
    EditableExplorationBackendApiService,
    private readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService,
    private localStorageService: LocalStorageService,
    private urlService: UrlService,
    private alertsService: AlertsService,
    private windowRef: WindowRef,
    private loggerService: LoggerService,
    private explorationDataBackendApiService: ExplorationDataBackendApiService
  ) {
    // The pathname (without the hash) should be: .../create/{exploration_id}
    this.pathname = urlService.getPathname();
    this.pathnameArray = this.pathname.split('/');
    for (let i = 0; i < this.pathnameArray.length; i++) {
      if (this.pathnameArray[i] === 'create') {
        this.explorationId = this.pathnameArray[i + 1];
        break;
      }
    }

    if (!this.explorationId) {
      this.loggerService.error(
        'Unexpected call to ExplorationDataService for pathname ' + this.pathname);
      // Note: if we do not return anything, Karma unit tests fail.
    }

    this.explorationData = {
      explorationId: this.explorationId,
      data: null
    };
    this.resolvedAnswersUrlPrefix =
      '/createhandler/resolved_answers/' + this.explorationId;
    this.explorationDraftAutosaveUrl =
      '/createhandler/autosave_draft/' + this.explorationId;
  }

  // Note that the changeList is the full changeList since the last
  // committed version (as opposed to the most recent autosave).
  autosaveChangeList(
      changeList: ExplorationChangeList[],
      successCallback: (value?: {}) => void,
      errorCallback: Function) {
    // First save locally to be retrieved later if save is unsuccessful.
    if (this.localStorageService && this.localStorageService.saveExplorationDraft) {
      this.localStorageService.saveExplorationDraft(
        this.explorationId, changeList, this.draftChangeListId);
    }
    let autosaveChangeListRequest: ExplorationAutosaveChangeListRequest =
    {
      change_list: changeList,
      version: this.explorationData.data.version
    };
    this.explorationDataBackendApiService.setAutoSaveChangeList(
      this.explorationDraftAutosaveUrl,
      autosaveChangeListRequest
    ).then((response : ExplorationAutosaveChangeListResponse) => {
      this.draftChangeListId = response.draft_change_list_id;
      // We can safely remove the locally saved draft copy if it was saved
      // to the backend.
      this.localStorageService.removeExplorationDraft(this.explorationId);
      successCallback(response);
    }, errorResponse => {
      errorCallback();
    });
  }

  discardDraft(
      successCallback: (value?: Object) => void,
      errorCallback: (reason?: string) => void)
    : Promise<Object> {
    return new Promise((resolve, reject) => {
      this.explorationDataBackendApiService.setDiscardDraft(
        this.explorationDraftAutosaveUrl)
        .then(response => {
          this.localStorageService.removeExplorationDraft(this.explorationId);
          successCallback(response);
        }, errorResponse => {
          errorCallback(errorResponse.error.error);
        });
    });
  }

  // Returns a promise that supplies the data for the current exploration.
  getData(errorCallback: (reason?: string) => void)
  : Promise<DraftExplorationResponse|ExplorationAutosaveChangeListResponse> {
    if (!this.explorationId) {
      throw new Error('explorationDataService.getData is not a function');
    }
    return new Promise((resolve, reject) => {
      if (this.explorationData.data) {
        this.loggerService.info('Found exploration data in cache.');
        return new Promise((resolve, reject) => {
          resolve(this.explorationData.data);
        });
      } else {
      // Retrieve data from the server.
      // WARNING: Note that this is a version of the exploration with draft
      // changes applied. This makes a force-refresh necessary when changes
      // are discarded, otherwise the exploration-with-draft-changes
      // (which is cached here) will be reused.
        return (
          this.editableExplorationBackendApiService.fetchApplyDraftExploration(
            this.explorationId).then((response: DraftExplorationResponse) => {
            this.loggerService.info('Retrieved exploration data : ' + response);
            this.draftChangeListId = response.draft_change_list_id;
            this.explorationData.data = response;
            let draft = this.localStorageService.getExplorationDraft(
              this.explorationId);
            if (draft) {
              if (draft.isValid(this.draftChangeListId)) {
                let changeList = draft.getChanges();
                this.autosaveChangeList(changeList, resolve, () => {
                // A reload is needed so that the changelist just saved is
                // loaded as opposed to the exploration returned by this
                // response.
                  this.windowRef.nativeWindow.location.reload();
                });
              } else {
                if (errorCallback) {
                  errorCallback(this.explorationId);
                }
              }
            }
            return response;
          }, errorResponse => {
            errorCallback(errorResponse);
          }));
      }
    });
  }

  // Returns a promise supplying the last saved version for the current
  // exploration.
  getLastSavedData(): Promise<ReadOnlyExplorationBackendDict> {
    return this.readOnlyExplorationBackendApiService.loadLatestExploration(
      this.explorationId).then((response) => {
      this.loggerService.info('Retrieved saved exploration data.' + response);
      return response.exploration;
    });
  }

  resolveAnswers(
      stateName: string,
      resolvedAnswersList: string[],
      successCallback: (value?: {}) => void,
      errorCallback: (reason?: string) => void)
    : Promise<{}> {
    return new Promise((resolve, reject) => {
      this.alertsService.clearWarnings();
      let resolveAnswerUrl =
        this.resolvedAnswersUrlPrefix + '/' + encodeURIComponent(stateName);
      let resolveAnswerDict: ResolveAnswerResponse = {
        resolved_answers: resolvedAnswersList
      };
      this.explorationDataBackendApiService.setResolveAnswer(
        resolveAnswerUrl,
        resolveAnswerDict).then(response => {
        successCallback();
      }, errorResponse => {
        errorCallback();
      });
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
      changeList: string[],
      commitMessage: string,
      successCallback: (value: ExplorationBackendDict) => void,
      errorCallback: (reason?: string) => void)
    : Promise<ExplorationBackendDict> {
    return new Promise((resolve, reject) => {
      this.editableExplorationBackendApiService.updateExploration(
        this.explorationId,
        this.explorationData.data ? this.explorationData.data.version : null,
        commitMessage, changeList).then(
        response => {
          this.alertsService.clearWarnings();
          this.explorationData.data = response;
          successCallback(response);
        }, errorResponse => {
          errorCallback(errorResponse);
        }
      );
    });
  }
}

angular.module('oppia').factory(
  'ExplorationDataService', downgradeInjectable(ExplorationDataService)
);
