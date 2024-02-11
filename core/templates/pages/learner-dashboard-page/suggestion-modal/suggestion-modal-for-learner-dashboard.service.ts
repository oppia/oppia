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
 * @fileoverview Service to display suggestion modal in learner view.
 */

import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { LearnerDashboardSuggestionModalComponent } from './learner-dashboard-suggestion-modal.component';
interface ExtraParams {
  'newContent': string;
  'oldContent': string;
  'description': string;
}

@Injectable({
  providedIn: 'root'
})
export class SuggestionModalForLearnerDashboardService {
  constructor(
    private ngbModal: NgbModal,
  ) {}

  private _showEditStateContentSuggestionModal(
      newContent: string, oldContent: string, description: string): void {
    const modelRef = this.ngbModal.open(
      LearnerDashboardSuggestionModalComponent, {backdrop: true});
    modelRef.componentInstance.newContent = newContent;
    modelRef.componentInstance.oldContent = oldContent;
    modelRef.componentInstance.description = description;
    modelRef.result.then(() => {}, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  showSuggestionModal(suggestionType: string, extraParams: ExtraParams): void {
    if (suggestionType === 'edit_exploration_state_content') {
      this._showEditStateContentSuggestionModal(
        extraParams.newContent,
        extraParams.oldContent,
        extraParams.description
      );
    }
  }
}
