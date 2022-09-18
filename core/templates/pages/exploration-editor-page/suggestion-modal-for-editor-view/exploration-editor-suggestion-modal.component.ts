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
 * @fileoverview Component exploration editor suggestion modal.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { EditabilityService } from 'services/editability.service';
import { SuggestionModalService } from 'services/suggestion-modal.service';

@Component({
  selector: 'oppia-exploration-editor-suggestion-modal',
  templateUrl: './exploration-editor-suggestion-modal.component.html'
})
export class ExplorationEditorSuggestionModalComponent
   extends ConfirmOrCancelModal implements OnInit {
  @Input() currentContent: string;
  @Input() newContent: string;
  @Input() suggestionIsHandled: boolean;
  @Input() suggestionIsValid: boolean;
  @Input() suggestionStatus: string;
  @Input() threadNgbModalInstance: NgbActiveModal;
  @Input() unsavedChangesExist: boolean;

  canEdit: boolean;
  commitMessage: string;
  reviewMessage: string;
  MAX_COMMIT_MESSAGE_LENGTH = AppConstants.MAX_COMMIT_MESSAGE_LENGTH;
  isNotHandled: boolean;
  canReject: boolean;
  errorMessage: string;
  canAccept: boolean;

  constructor(
    private editabilityService: EditabilityService,
    private ngbActiveModal: NgbActiveModal,
    private suggestionModalService: SuggestionModalService,
  ) {
    super(ngbActiveModal);
  }

  acceptSuggestion(): void {
    if (this.threadNgbModalInstance !== null) {
      this.threadNgbModalInstance.close();
    }
    this.suggestionModalService.acceptSuggestion(this.ngbActiveModal, {
      action: AppConstants.ACTION_ACCEPT_SUGGESTION,
      commitMessage: this.commitMessage,
      reviewMessage: this.reviewMessage,
      // TODO(sll): If audio files exist for the content being
      // replaced, implement functionality in the modal for the
      // exploration creator to indicate whether this change
      // requires the corresponding audio subtitles to be updated.
      // For now, we default to assuming that the changes are
      // sufficiently small as to warrant no updates.
      audioUpdateRequired: false
    });
  }

  rejectSuggestion(): void {
    if (this.threadNgbModalInstance !== null) {
      this.threadNgbModalInstance.close();
    }

    return this.suggestionModalService.rejectSuggestion(
      this.ngbActiveModal, {
        action: AppConstants.ACTION_REJECT_SUGGESTION,
        reviewMessage: this.reviewMessage
      });
  }

  ngOnInit(): void {
    this.isNotHandled = !this.suggestionIsHandled;
    this.canEdit = this.editabilityService.isEditable();
    this.commitMessage = '';
    this.reviewMessage = '';
    this.canReject = this.canEdit && this.isNotHandled;
    this.canAccept = this.canEdit && this.isNotHandled &&
     this.suggestionIsValid && !this.unsavedChangesExist;

    if (!this.isNotHandled) {
      this.errorMessage =
         ['accepted', 'fixed'].includes(this.suggestionStatus) ?
           this.suggestionModalService.SUGGESTION_ACCEPTED_MSG :
           this.suggestionModalService.SUGGESTION_REJECTED_MSG;
    } else if (!this.suggestionIsValid) {
      this.errorMessage =
         this.suggestionModalService.SUGGESTION_INVALID_MSG;
    } else if (this.unsavedChangesExist) {
      this.errorMessage = this.suggestionModalService.UNSAVED_CHANGES_MSG;
    } else {
      this.errorMessage = '';
    }
  }

  cancelReview(): void {
    this.suggestionModalService.cancelSuggestion(this.ngbActiveModal);
  }
}

angular.module('oppia').directive('oppiaExplorationEditorSuggestionModal',
   downgradeComponent({
     component: ExplorationEditorSuggestionModalComponent
   }) as angular.IDirectiveFactory);
