// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the Oppia 'Delete Account' page.
 */

import {Component} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DeleteAccountBackendApiService} from './services/delete-account-backend-api.service';
import {DeleteAccountModalComponent} from './templates/delete-account-modal.component';

@Component({
  selector: 'oppia-delete-account-page',
  templateUrl: './delete-account-page.component.html',
})
export class DeleteAccountPageComponent {
  constructor(
    private ngbModal: NgbModal,
    private deleteAccountBackendApiService: DeleteAccountBackendApiService
  ) {}

  deleteAccount(): void {
    const modelRef = this.ngbModal.open(DeleteAccountModalComponent, {
      backdrop: true,
    });
    modelRef.result.then(
      () => {
        this.deleteAccountBackendApiService.deleteAccount();
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }
}
