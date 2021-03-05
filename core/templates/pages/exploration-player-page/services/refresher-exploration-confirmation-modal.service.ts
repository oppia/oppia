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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefresherExplorationConfirmationModalComponent } from '../templates/refresher-exploration-confirmation-modal.component';

/**
 * @fileoverview Service for managing the redirection to a refresher
 * exploration.
 */

@Injectable({
  providedIn: 'root'
})
export class RefresherExplorationConfirmationModalService {
  constructor(
    private ngBModal: NgbModal
  ) { }

  displayRedirectConfirmationModal(
      refresherExplorationId: string,
      redirectConfirmationCallback: () => void): void {
    const modalRef = this.ngBModal.open(
      RefresherExplorationConfirmationModalComponent,
      {
        backdrop: 'static'
      }
    );
    modalRef.result.then(() => {}, () => {});
    modalRef.componentInstance.redirectConfirmationCallback =
    redirectConfirmationCallback;
    modalRef.componentInstance.refresherExplorationId =
    refresherExplorationId;
  }
}

angular.module('oppia').factory(
  'RefresherExplorationConfirmationModalService',
  downgradeInjectable(RefresherExplorationConfirmationModalService)
);
