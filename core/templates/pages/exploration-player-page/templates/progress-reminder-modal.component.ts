// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the progress reminder modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

const CHECKPOINT_STATUS_INCOMPLETE = 'incomplete';
const CHECKPOINT_STATUS_COMPLETED = 'completed';
const CHECKPOINT_STATUS_IN_PROGRESS = 'in-progress';

import './progress-reminder-modal.component.css';

@Component({
  selector: 'oppia-progress-reminder-modal',
  templateUrl: './progress-reminder-modal.component.html',
  styleUrls: ['./progress-reminder-modal.component.css']
})

export class ProgressReminderModalComponent extends ConfirmOrCancelModal {
  // These properties below are initialized using Angular lifecycle hooks,
  // and hence we need non-null assertion here. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  completedCheckpointsCount!: number;
  checkpointCount!: number;
  explorationTitle!: string;
  checkpointStatusArray!: string[];

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private i18nLanguageCodeService: I18nLanguageCodeService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.checkpointStatusArray = new Array(this.checkpointCount);
    for (let i = 0; i < this.completedCheckpointsCount; i++) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_COMPLETED;
    }
    // If not all checkpoints are completed, then the checkpoint immediately
    // following the last completed checkpoint is labeled 'in-progress'.
    if (this.checkpointCount > this.completedCheckpointsCount) {
      this.checkpointStatusArray[this.completedCheckpointsCount] = (
        CHECKPOINT_STATUS_IN_PROGRESS);
    }
    for (
      let i = this.completedCheckpointsCount + 1;
      i < this.checkpointCount;
      i++
    ) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_INCOMPLETE;
    }
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  getCompletedProgressBarWidth(): number {
    if (this.completedCheckpointsCount === 0) {
      return 0;
    }
    const spaceBetweenEachNode = 100 / (this.checkpointCount - 1);
    return (
      ((this.completedCheckpointsCount - 1) * spaceBetweenEachNode) +
      (spaceBetweenEachNode / 2));
  }

  getProgressInFractionForm(): string {
    return `${this.completedCheckpointsCount}/${this.checkpointCount}`;
  }
}
