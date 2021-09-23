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
 * @fileoverview Service to display suggestion modal in creator view.
 */

import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { SuggestionModalForCreatorViewComponent } from './suggestion-modal-for-creator-view.component';
import { SuggestionModalForCreatorViewBackendApiService } from './suggestion-modal-for-creator-view-backend-api.service';

export interface ExtraParams {
  activeThread: any;
  suggestionsToReviewList: any;
  clearActiveThread: any;
  canReviewActiveThread: any;
}

@Injectable({
  providedIn: 'root'
})
export class SuggestionModalForCreatorDashboardService {
  constructor(
    private ngbModal: NgbModal,
    private urlInterpolationService: UrlInterpolationService,
    private suggestionModalForCreatorViewBackendApiService:
      SuggestionModalForCreatorViewBackendApiService
  ) {}

  _showEditStateContentSuggestionModal(
      activeThread,
      suggestionsToReviewList,
      clearActiveThread,
      canReviewActiveThread
  ): void {
    const modalRef = this.ngbModal.open(
      SuggestionModalForCreatorViewComponent,
      {
        backdrop: 'static',
        size: 'lg'
      }
    );
    modalRef.componentInstance.suggestionIsHandled = (
      activeThread.isSuggestionHandled);
    modalRef.componentInstance.suggestionStatus = (
      activeThread.getSuggestionStatus);
    modalRef.componentInstance.description = activeThread.description;
    modalRef.componentInstance.oldContent = activeThread.suggestion.oldValue;
    modalRef.componentInstance.newContent = activeThread.suggestion.newValue;
    modalRef.componentInstance.canReviewActiveThread = canReviewActiveThread;
    modalRef.componentInstance.stateName = activeThread.suggestion.stateName;
    modalRef.componentInstance.suggestionType = (
      activeThread.suggestion.suggestionType);

    let url = null;
    let data = null;

    modalRef.result.then((result) => {
      let RESUBMIT_SUGGESTION_URL_TEMPLATE = (
        '/suggestionactionhandler/resubmit/<suggestion_id>');
      let HANDLE_SUGGESTION_URL_TEMPLATE = (
        '/suggestionactionhandler/<target_type>/<target_id>/<suggestion_id>');

      if (result.action === 'resubmit' &&
          result.suggestionType === 'edit_exploration_state_content') {
        url = this.urlInterpolationService.interpolateUrl(
          RESUBMIT_SUGGESTION_URL_TEMPLATE, {
            suggestion_id: activeThread.suggestion.suggestionId
          }
        );
        data = {
          action: result.action,
          summary_message: result.summaryMessage,
          change: {
            cmd: 'edit_state_property',
            property_name: 'content',
            state_name: result.stateName,
            old_value: result.oldContent,
            new_value: {
              html: result.newSuggestionHtml
            }
          }
        };
      } else {
        url = this.urlInterpolationService.interpolateUrl(
          HANDLE_SUGGESTION_URL_TEMPLATE, {
            target_type: activeThread.suggestion.targetType,
            target_id: activeThread.suggestion.targetId,
            suggestion_id: activeThread.suggestion.suggestionId
          }
        );
        data = {
          action: result.action,
          commit_message: result.commitMessage,
          review_message: result.reviewMessage
        };
      }
      this.suggestionModalForCreatorViewBackendApiService
        .postSuggestionToReview(url, data);
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  showSuggestionModal(
      suggestionType: string,
      extraParams: ExtraParams
  ): void {
    if (suggestionType === 'edit_exploration_state_content') {
      this._showEditStateContentSuggestionModal(
        extraParams.activeThread,
        extraParams.suggestionsToReviewList,
        extraParams.clearActiveThread,
        extraParams.canReviewActiveThread
      );
    }
  }
}

