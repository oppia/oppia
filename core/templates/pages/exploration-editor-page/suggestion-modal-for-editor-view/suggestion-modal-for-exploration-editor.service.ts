// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to display suggestion modal in editor view.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { ThreadDataBackendApiService } from '../feedback-tab/services/thread-data-backend-api.service';
import { ExplorationDataService } from '../services/exploration-data.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { RouterService } from '../services/router.service';
import { StateEditorRefreshService } from '../services/state-editor-refresh.service';
import { ExplorationEditorSuggestionModalComponent } from './exploration-editor-suggestion-modal.component';
import { AppConstants } from 'app.constants';
import { LoggerService } from 'services/contextual/logger.service';
import { SuggestionThread } from 'domain/suggestion/suggestion-thread-object.model';

export interface ExtraParams {
  activeThread: SuggestionThread;
  isSuggestionHandled: boolean;
  isSuggestionValid: boolean;
  hasUnsavedChanges: boolean;
  setActiveThread: (threadId: string) => Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class SuggestionModalForExplorationEditorService {
  constructor(
    private explorationDataService: ExplorationDataService,
    private explorationStatesService: ExplorationStatesService,
    private loggerService: LoggerService,
    private ngbModal: NgbModal,
    private routerService: RouterService,
    private stateEditorRefreshService: StateEditorRefreshService,
    private stateObjectFactory: StateObjectFactory,
    private threadDataBackendApiService: ThreadDataBackendApiService,
  ) { }

  showEditStateContentSuggestionModal(
      activeThread: SuggestionThread,
      isSuggestionHandled: boolean,
      hasUnsavedChanges: boolean,
      isSuggestionValid: boolean,
      setActiveThread = (threadId => {}),
      threadUibModalInstance = null
  ): void {
    const modalRef = this.ngbModal.open(
      ExplorationEditorSuggestionModalComponent, {
        backdrop: 'static',
        size: 'lg',
      });

    let stateName = activeThread.getSuggestionStateName();
    let state = this.explorationStatesService.getState(stateName);

    modalRef.componentInstance.currentContent = (state && state.content.html);
    modalRef.componentInstance.newContent = (
      activeThread.getReplacementHtmlFromSuggestion());
    modalRef.componentInstance.suggestionIsHandled = (
      isSuggestionHandled),
    modalRef.componentInstance.suggestionIsValid = (
      isSuggestionValid),
    modalRef.componentInstance.suggestionStatus = (
      activeThread.getSuggestionStatus()),
    modalRef.componentInstance.threadUibModalInstance = (
      threadUibModalInstance),
    modalRef.componentInstance.unsavedChangesExist = (
      hasUnsavedChanges);

    modalRef.result.then(result => {
      return this.threadDataBackendApiService.resolveSuggestionAsync(
        activeThread,
        result.action,
        result.commitMessage,
        result.reviewMessage
      ).then(
        () => {
          setActiveThread(activeThread.threadId);
          // Immediately update editor to reflect accepted suggestion.
          if (result.action === AppConstants.ACTION_ACCEPT_SUGGESTION) {
            let suggestion = activeThread.getSuggestion();
            let stateName = suggestion.stateName;
            let stateDict = this.explorationDataService.data.states[stateName];
            let state = this.stateObjectFactory.createFromBackendDict(
              stateName, stateDict);

            state.content.html = (
              activeThread.getReplacementHtmlFromSuggestion());
            if (result.audioUpdateRequired) {
              state.recordedVoiceovers.markAllVoiceoversAsNeedingUpdate(
                state.content.contentId);
            }

            this.explorationDataService.data.version += 1;
            this.explorationStatesService.setState(stateName, state);
            this.routerService.onRefreshVersionHistory.emit({
              forceRefresh: true
            });
            this.stateEditorRefreshService.onRefreshStateEditor.emit();
          }
        },
        () => {
          this.loggerService.error('Error resolving suggestion');
        });
    },
    () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  showSuggestionModal(
      suggestionType: string,
      extraParams: ExtraParams,
      threadUibModalInstance = null): void {
    if (!extraParams.activeThread) {
      throw new Error(
        'Trying to show suggestion of a non-existent thread.');
    }

    if (suggestionType === 'edit_exploration_state_content') {
      this.showEditStateContentSuggestionModal(
        extraParams.activeThread, extraParams.isSuggestionHandled,
        extraParams.hasUnsavedChanges, extraParams.isSuggestionValid,
        extraParams.setActiveThread, threadUibModalInstance);
    }
  }
}

angular.module('oppia').factory(
  'SuggestionModalForExplorationEditorService',
  downgradeInjectable(
    SuggestionModalForExplorationEditorService
  ));
