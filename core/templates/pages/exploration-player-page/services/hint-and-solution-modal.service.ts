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
 * @fileoverview Service for showing the hint and solution modals.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DisplayHintModalComponent } from '../modals/display-hint-modal.component';
import { DisplaySolutionInterstititalModalComponent } from '../modals/display-solution-interstitial-modal.component';
import { DisplaySolutionModalComponent } from '../modals/display-solution-modal.component';

@Injectable({
  providedIn: 'root'
})
export class HintAndSolutionModalService {
  constructor(
    private ngbModal: NgbModal
  ) {}

  displayHintModal(index: number): NgbModalRef {
    let modalRef: NgbModalRef = this.ngbModal.open(
      DisplayHintModalComponent, {
        backdrop: 'static'
      });
    modalRef.componentInstance.index = index;
    return modalRef;
  }

  displaySolutionModal(): NgbModalRef {
    return this.ngbModal.open(DisplaySolutionModalComponent, {
      backdrop: 'static'
    });
  }

  displaySolutionInterstitialModal(): NgbModalRef {
    return this.ngbModal.open(DisplaySolutionInterstititalModalComponent, {
      backdrop: 'static'
    });
  }
}

angular.module('oppia').factory('HintAndSolutionModalService',
  downgradeInjectable(HintAndSolutionModalService));
