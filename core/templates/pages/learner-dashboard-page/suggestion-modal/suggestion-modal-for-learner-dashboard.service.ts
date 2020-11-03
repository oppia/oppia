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
 * @fileoverview Service to display suggestion modal in learner view.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LearnerDashboardSuggestionModalComponent } from 
  'pages/learner-dashboard-page/suggestion-modal/learner-dashboard-suggestion-modal.component.ts';

@Injectable({
  providedIn: 'root'
})
export class SuggestionModalForLearnerDashboardService {
  constructor(
    private nbgModal: NgbModal,
    private urlInterpolationService: UrlInterpolationService
  ){}

  _showEditStateContentSuggestionModal(newContent:string, oldContent:string, description:string): void {
    const modelRef = this.nbgModal.open(
      LearnerDashboardSuggestionModalComponent,{backdrop: true});

    modelRef.componentInstance.newContent = newContent;
    modelRef.componentInstance.oldContent = oldContent;
    modelRef.componentInstance.description = description;
  }
  showSuggestionModal(suggestionType, extraParams): void {
    if (suggestionType === 'edit_exploration_state_content') {
      this._showEditStateContentSuggestionModal(
        extraParams.newContent,
        extraParams.oldContent,
        extraParams.description
      );
    }
  }
}
angular.module('oppia').factory('SuggestionModalForLearnerDashboardService', downgradeInjectable(SuggestionModalForLearnerDashboardService));