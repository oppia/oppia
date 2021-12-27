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
 * @fileoverview Service for detecting spamming behavior from the learner.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TakeBreakModalComponent } from 'pages/exploration-player-page/templates/take-break-modal.component';


@Injectable({
  providedIn: 'root'
})
export class FatigueDetectionService {
  private submissionTimesMsec: number[] = [];
  private SPAM_COUNT_THRESHOLD: number = 4;
  private SPAM_WINDOW_MSEC: number = 10000;
  // Function shift return result type T | undefined
  // so WindowStartTime can be undefined.
  private windowStartTime!: number | undefined;
  private windowEndTime!: number;

  constructor(
    private ngbModal: NgbModal) { }

  recordSubmissionTimestamp(): void {
    this.submissionTimesMsec.push((new Date()).getTime());
  }

  isSubmittingTooFast(): boolean {
    if (this.submissionTimesMsec.length >= this.SPAM_COUNT_THRESHOLD) {
      this.windowStartTime = this.submissionTimesMsec.shift();
      this.windowEndTime =
        this.submissionTimesMsec[this.submissionTimesMsec.length - 1];
      if (this.windowStartTime !== undefined && (this.windowEndTime.valueOf() -
        this.windowStartTime.valueOf() < this.SPAM_WINDOW_MSEC)
      ) {
        return true;
      }
    }
    return false;
  }

  displayTakeBreakMessage(): void {
    this.ngbModal.open(
      TakeBreakModalComponent,
      {
        backdrop: 'static'
      }).result.then(() => { }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  reset(): void {
    this.submissionTimesMsec = [];
  }
}

angular.module('oppia').factory(
  'FatigueDetectionService',
  downgradeInjectable(FatigueDetectionService));
