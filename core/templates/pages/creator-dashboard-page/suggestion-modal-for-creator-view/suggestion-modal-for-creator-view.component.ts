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
 * @fileoverview Component for suggestion modal in creator view.
 */

import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ParamDict, SuggestionModalService } from 'services/suggestion-modal.service';

@Component({
  selector: 'suggestion-modal-for-creator-view',
})
export class SuggestionModalForCreatorViewComponent implements OnInit {
  @Input() suggestionIsHandled;
  @Input() suggestionStatus: string;
  @Input() oldContent: string;
  @Input() newContent: { html: string; };
  @Input() stateName;
  @Input() suggestionType;
  @Input() description;
  @Input() canReviewActiveThread;
  isNotHandled: boolean;
  canReject: boolean;
  canAccept: boolean;
  errorMessage: string;
  isSuggestionRejected: boolean;
  reviewMessage: string;
  summaryMessage: string;
  suggestionData: { newSuggestionHtml: string; };
  suggestionEditorIsShown: boolean;
  MAX_COMMIT_MESSAGE_LENGTH: number;
  commitMessage: string;

  constructor(
    private suggestionModalService: SuggestionModalService,
    private ngbActiveModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.isNotHandled = !this.suggestionIsHandled;
    this.canReject = this.isNotHandled;
    this.canAccept = this.isNotHandled;
    if (!this.isNotHandled) {
      if (this.suggestionStatus === (
        this.suggestionModalService.SUGGESTION_ACCEPTED)) {
        this.errorMessage = this.suggestionModalService
          .SUGGESTION_ACCEPTED_MSG;
        this.isSuggestionRejected = false;
      } else {
        this.errorMessage = this.suggestionModalService
          .SUGGESTION_REJECTED_MSG;
        this.isSuggestionRejected = true;
      }
    } else {
      this.errorMessage = '';
    }

    this.reviewMessage = null;
    this.summaryMessage = null;
    // The ng-model needs to bind to a property of an object on
    // the scope (the property cannot sit directly on the scope)
    // Reference https://stackoverflow.com/q/12618342
    this.suggestionData = {newSuggestionHtml: this.newContent.html};
    this.suggestionEditorIsShown = false;
    this.MAX_COMMIT_MESSAGE_LENGTH = AppConstants.MAX_COMMIT_MESSAGE_LENGTH;
  }


  acceptSuggestion(): void {
    this.suggestionModalService.acceptSuggestion(
      this.ngbActiveModal,
      {
        action: AppConstants.ACTION_ACCEPT_SUGGESTION,
        commitMessage: this.commitMessage,
        reviewMessage: this.reviewMessage,
      } as ParamDict);
  }

  rejectSuggestion(): void {
    this.suggestionModalService.rejectSuggestion(
      this.ngbActiveModal,
      {
        action: AppConstants.ACTION_REJECT_SUGGESTION,
        commitMessage: null,
        reviewMessage: this.reviewMessage
      } as ParamDict);
  }

  editSuggestion(): void {
    this.suggestionEditorIsShown = true;
  }

  cancel(): void {
    this.suggestionModalService.cancelSuggestion(this.ngbActiveModal);
  }

  isEditButtonShown(): boolean {
    return (
      !this.isNotHandled && this.isSuggestionRejected &&
      !this.suggestionEditorIsShown);
  }

  isResubmitButtonShown(): boolean {
    return (
      !this.isNotHandled && this.isSuggestionRejected &&
      this.suggestionEditorIsShown);
  }

  isResubmitButtonDisabled(): boolean {
    return !(
      this.summaryMessage &&
      (
        this.suggestionData.newSuggestionHtml.trim() !==
        this.newContent.html.trim()));
  }

  cancelEditMode(): void {
    this.suggestionEditorIsShown = false;
  }

  updateValue(value: string): void {
    this.suggestionData.newSuggestionHtml = value;
  }

  resubmitChanges(): void {
    this.ngbActiveModal.close({
      action: this.suggestionModalService.ACTION_RESUBMIT_SUGGESTION,
      newSuggestionHtml: this.suggestionData.newSuggestionHtml,
      summaryMessage: this.summaryMessage,
      stateName: this.stateName,
      suggestionType: this.suggestionType,
      oldContent: this.oldContent
    });
  }
}
