// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for flag exploration modal.
 */

import {Component, Optional} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {PlayerPositionService} from '../../services/player-position.service';
import './flag-lesson-modal.component.css';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {PageContextService} from 'services/page-context.service';
import {LearnerLocalNavBackendApiService} from 'pages/exploration-player-page/services/learner-local-nav-backend-api.service';
import {AlertsService} from 'services/alerts.service';

export interface FlagExplorationModalResult {
  report_type: boolean;
  report_text: string;
  state: string;
}

@Component({
  selector: 'oppia-new-flag-lesson-modal',
  templateUrl: './flag-lesson-modal.component.html',
  styleUrls: ['./flag-lesson-modal.component.css'],
})
export class NewFlagExplorationModalComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  flagMessage!: string;
  flagMessageTextareaIsShown: boolean = false;
  flag: boolean = false;
  thankYouModalIsShown: boolean = false;

  constructor(
    @Optional() private ngbActiveModal: NgbActiveModal,
    @Optional() private bottomSheetRef: MatBottomSheetRef,
    private focusManagerService: FocusManagerService,
    private pageContextService: PageContextService,
    private learnerLocalNavBackendApiService: LearnerLocalNavBackendApiService,
    private alertsService: AlertsService,
    private playerPositionService: PlayerPositionService
  ) {}

  showFlagMessageTextarea(value: boolean): void {
    if (value) {
      this.flagMessageTextareaIsShown = true;
      this.focusManagerService.setFocus('flagMessageTextarea');
    }
  }

  submitReport(): void {
    const explorationId = this.pageContextService.getExplorationId();
    if (this.flagMessageTextareaIsShown) {
      const result: FlagExplorationModalResult = {
        report_type: this.flag,
        report_text: this.flagMessage,
        state: this.playerPositionService.getCurrentStateName(),
      };
      this.learnerLocalNavBackendApiService
        .postReportAsync(explorationId, result)
        .then(
          () => {},
          error => {
            this.alertsService.addWarning(error);
          }
        );

      this.thankYouModalIsShown = true;
    }
  }

  closeModal(): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss();
    } else if (this.ngbActiveModal) {
      this.ngbActiveModal.dismiss('cancel');
    }
  }
}
