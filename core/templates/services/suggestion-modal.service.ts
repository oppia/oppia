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
 * @fileoverview Service to handle common code for suggestion modal display.
 */

import {Injectable} from '@angular/core';

import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

export interface ParamDict {
  action: string;
  audioUpdateRequired?: boolean;
  commitMessage?: string;
  reviewMessage: string;
  skillDifficulty?: number;
}

@Injectable({
  providedIn: 'root',
})
export class SuggestionModalService {
  SUGGESTION_ACCEPTED_MSG: string =
    'This suggestion has already been accepted.';

  SUGGESTION_REJECTED_MSG: string =
    'This suggestion has already been rejected.';

  SUGGESTION_INVALID_MSG: string =
    'This suggestion was made for a state that no longer exists.' +
    ' It cannot be accepted.';

  UNSAVED_CHANGES_MSG: string =
    'You have unsaved changes to this exploration. Please save/discard your ' +
    'unsaved changes if you wish to accept.';

  ACTION_RESUBMIT_SUGGESTION: string = 'resubmit';
  SUGGESTION_ACCEPTED: string = 'accepted';
  SUGGESTION_REJECTED: string = 'rejected';

  /**
   * @param {object} $uibModalInstance - An IModalServiceInstance object which
   * includes the following methods and properties.
   * - close: a method that can be used to close a modal.
   * - dismiss: a method that can be used to dismiss a modal.
   * - result: a promise that is resolved when a modal is closed and rejected
   *    when a modal is dismissed.
   * - opened: a promise that is resolved when a modal gets opened after
   *    downloading content's template and resolving all variables.
   * - rendered: a promise that is resolved when a modal is rendered.
   * - closed: a promise that is resolved when a modal is closed and the
   *    animation completes.
   * @param {object} paramDict - A ParamDict object which includes the
   * the follwing keys:
   * - action: action of the suggestion.
   * - audioUpdateRequired: whether audio files exist for the content
   *    being replace.
   * - commitMessage: commit message for the suggestion.
   * - reviewMessage: review message for the suggestion.
   */
  acceptSuggestion(ngbActiveModal: NgbActiveModal, paramDict: ParamDict): void {
    ngbActiveModal.close(paramDict);
  }

  /**
   * @param {object} $uibModalInstance - An IModalServiceInstance object which
   * includes the following methods and properties.
   * - close: a method that can be used to close a modal.
   * - dismiss: a method that can be used to dismiss a modal.
   * - result: a promise that is resolved when a modal is closed and rejected
   *    when a modal is dismissed.
   * - opened: a promise that is resolved when a modal gets opened after
   *    downloading content's template and resolving all variables.
   * - rendered: a promise that is resolved when a modal is rendered.
   * - closed: a promise that is resolved when a modal is closed and the
   *    animation completes.
   * @param {object} paramDict - A ParamDict object which includes the
   * the follwing keys:
   * - action: action of the suggestion.
   * - audioUpdateRequired: whether audio files exist for the content
   *    being replace.
   * - commitMessage: commit message for the suggestion.
   * - reviewMessage: review message for the suggestion.
   */
  rejectSuggestion(ngbActiveModal: NgbActiveModal, paramDict: ParamDict): void {
    ngbActiveModal.close(paramDict);
  }

  /**
   * @param {object} $uibModalInstance - An IModalServiceInstance object which
   * includes the following methods and properties.
   * - close: a method that can be used to close a modal.
   * - dismiss: a method that can be used to dismiss a modal.
   * - result: a promise that is resolved when a modal is closed and rejected
   *    when a modal is dismissed.
   * - opened: a promise that is resolved when a modal gets opened after
   *    downloading content's template and resolving all variables.
   * - rendered: a promise that is resolved when a modal is rendered.
   * - closed: a promise that is resolved when a modal is closed and the
   *    animation completes.
   */
  cancelSuggestion(ngbActiveModal: NgbActiveModal): void {
    ngbActiveModal.dismiss('cancel');
  }
}
