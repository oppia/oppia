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
 * @fileoverview Component for flag exploration modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { PlayerPositionService } from '../services/player-position.service';

export interface FlagExplorationModalResult {
  'report_type': boolean;
  'report_text': string;
  state: string;
}

@Component({
  selector: 'oppia-flag-exploration-modal',
  templateUrl: './flag-exploration-modal.component.html'
})
export class FlagExplorationModalComponent extends ConfirmOrCancelModal {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  flagMessage!: string;
  stateName!: string;
  flagMessageTextareaIsShown: boolean = false;
  flag: boolean = false;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private focusManagerService: FocusManagerService,
    private playerPositionService: PlayerPositionService
  ) {
    super(ngbActiveModal);
    this.stateName = this.playerPositionService.getCurrentStateName();
  }

  showFlagMessageTextarea(value: boolean): void {
    if (value) {
      this.flagMessageTextareaIsShown = true;
      this.focusManagerService.setFocus('flagMessageTextarea');
    }
  }

  submitReport(): void {
    if (this.flagMessageTextareaIsShown) {
      this.ngbActiveModal.close({
        report_type: this.flag,
        report_text: this.flagMessageTextareaIsShown,
        state: this.stateName
      });
    }
  }
}
